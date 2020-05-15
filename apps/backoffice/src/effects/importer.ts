import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as bluebird from 'bluebird';
import { chunk } from 'lodash';
import { concat, from, of } from 'rxjs';
import { catchError, flatMap, map, take, tap, withLatestFrom } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as importer from '../actions/importer';
import {
    blockIfNotLoggedIn,
    blockIfNotLoggedInOrHasNoWritePermission,
    SimpleAction,
} from '../common/effects-extensions';
import { parseCsvAsObservable } from '../common/file-extensions';
import {
    dbNames,
    dropLocalDatabase,
    dropMonthlyDatabases,
    dropRemoteCouchDatabase,
    dropRemoteCouchDatabaseAndSyncLocalToRemote,
    getAllDocumentsFromDb,
    getAuthorizedUsersAsync,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
    getLocalDatabase,
    makeDbReadonly,
    putAdminUserToDatabase,
    putAdminUserToDatabaseAsync,
    systemDbNames,
} from '../common/pouchdb-utils';
import { createUserDbs } from '../common/preiserheber-initialization';
import { preparePm, preparePms } from '../common/presta-data-mapper';
import { buildTree } from '../common/presta-warenkorb-mapper';
import * as fromRoot from '../reducers';

@Injectable()
export class ImporterEffects {
    loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    // TODO Fix types
    parseFile$ = this.actions$.ofType('PARSE_FILE').pipe(
        flatMap((action: any) => {
            if (action.payload.file == null) {
                return of({
                    type: 'PARSE_FILE_SUCCESS',
                    payload: { data: null, parsedType: action.payload.parseType },
                } as importer.Action);
            }
            return parseCsvAsObservable(action.payload.file).pipe(
                map(data => ({ parsedType: action.payload.parseType, data })),
                map(
                    ({ parsedType, data }) =>
                        ({ type: 'PARSE_FILE_SUCCESS', payload: { data, parsedType } } as importer.Action),
                ),
            );
        }),
    );

    @Effect()
    import$ = this.actions$.ofType('IMPORT_DATA').pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        map(action => action.payload),
        withLatestFrom(this.settings$),
        flatMap(([data, settings]) =>
            of({
                preismeldungen: preparePm(data.parsedPreismeldungen),
                preismeldestellen: preparePms(data.parsedPreismeldestellen),
                warenkorb: buildTree(data.parsedWarenkorb, settings.general.erhebungsorgannummer),
            }).pipe(
                flatMap(({ preismeldungen, preismeldestellen, warenkorb }) =>
                    concat(
                        [{ type: 'IMPORT_STARTED' }],
                        from(dropMonthlyDatabases()).pipe(
                            tap(x => console.log('1. CHECKSYSTEMDATABASES')),
                            flatMap(() => this.checkSystemDatabases()),
                            tap(x => console.log('2. IMPORTPREISMELDUNGEN')),
                            flatMap(() => this.importPreismeldungenAsync(preismeldungen)),
                            tap(x => console.log('3. IMPORTPREISMELDESTELLEN')),
                            flatMap(importPreismeldungAction =>
                                this.importPreismeldestellen(preismeldestellen).pipe(
                                    map(importPreismeldestellenAction => [
                                        importPreismeldungAction,
                                        importPreismeldestellenAction,
                                    ]),
                                ),
                            ),
                            tap(x => console.log('4. IMPORTWARENKORB')),
                            flatMap(actions =>
                                this.importWarenkorb(warenkorb).pipe(
                                    map(importWarenkorbAction => [...actions, importWarenkorbAction]),
                                ),
                            ),
                            tap(x => console.log('5. DROPANDRECREATEALLUSERDBS')),
                            flatMap(actions =>
                                this.dropAndRecreateAllUserDbs().pipe(map(action => [action, ...actions])),
                            ),
                            tap(x => console.log('6. UPDATEIMPORTMETADATA')),
                            flatMap(actions =>
                                this.updateImportMetadata(null, importer.Type.all_data).pipe(map(() => actions)),
                            ),
                            tap(x => console.log('7. LOADLATESTIMPORTEDAT')),
                            flatMap(actions => this.loadLatestImportedAt().pipe(map(action => [action, ...actions]))),
                            flatMap(actions => loaderhebungsMonateAction().then(action => [action, ...actions])),
                            tap(x => console.log('8. ACTIONS', x)),
                            flatMap(actions => actions),
                        ),
                    ),
                ),
                catchError(error => of({ type: 'IMPORTED_ALL_FAILURE', payload: [error] } as importer.Action)),
            ),
        ),
    );

    @Effect()
    loadLatestImportedAt$ = this.actions$.ofType('LOAD_LATEST_IMPORTED_AT').pipe(
        blockIfNotLoggedIn(this.store),
        flatMap(() => this.loadLatestImportedAt()),
    );

    @Effect()
    loadErhebungsmonate$ = this.actions$.ofType('LOAD_ERHEBUNGSMONATE').pipe(
        blockIfNotLoggedIn(this.store),
        flatMap(() => loaderhebungsMonateAction()),
    );

    private async checkSystemDatabases(): Promise<void> {
        const adminUser = await this.loggedInUser$.pipe(take(1)).toPromise();
        if (!adminUser) {
            throw Error('not logged in');
        }
        const dbChecks = systemDbNames.map(async dbName => {
            const hasUser = await getDatabase(dbName)
                .then(db => db.info()) // Check if exists, pouch creates the database if not
                .then(() =>
                    getAuthorizedUsersAsync(dbName).then(
                        x =>
                            !!x &&
                            !!x.members &&
                            !!x.members.names &&
                            x.members.names.some(name => name === adminUser.username),
                    ),
                );
            if (!hasUser) {
                await putAdminUserToDatabaseAsync(dbName, adminUser.username);
            }
        });
        await makeDbReadonly(dbNames.onoffline);
        return bluebird.all(dbChecks).then(() => {});
    }

    private updateImportMetadata(dbName: string, importerType: string) {
        return this.loggedInUser$.pipe(
            take(1),
            flatMap(user => (dbName === null ? of(null) : putAdminUserToDatabase(dbName, user.username))),
            flatMap(() =>
                getDatabase(dbNames.imports).then(db =>
                    db
                        .get(importerType)
                        .then(doc => doc._rev)
                        .catch(() => undefined)
                        .then(_rev => db.put({ latestImportAt: new Date().valueOf(), _id: importerType, _rev })),
                ),
            ),
        );
    }

    private async importPreismeldungenAsync(pmInfo: {
        erhebungsmonat: string;
        preismeldungen: P.PreismeldungReference[];
    }) {
        await dropLocalDatabase(dbNames.preismeldungen);
        await dropLocalDatabase(dbNames.preismeldungen_status);
        const localPreismeldungenDb = await getLocalDatabase(dbNames.preismeldungen);
        const localPreismeldungenStatusDb = await getLocalDatabase(dbNames.preismeldungen_status);

        await bluebird.all(
            chunk(pmInfo.preismeldungen, 6000).map(preismeldungenBatch =>
                localPreismeldungenDb
                    .bulkDocs(preismeldungenBatch)
                    .then(_ => preismeldungenBatch.length)
                    .catch(err => {
                        console.log('error is', err);
                        return 0;
                    }),
            ),
        );
        await localPreismeldungenDb.put({ _id: 'erhebungsmonat', monthAsString: pmInfo.erhebungsmonat });
        await dropRemoteCouchDatabaseAndSyncLocalToRemote(dbNames.preismeldungen);
        await this.updateImportMetadata(dbNames.preismeldungen, importer.Type.preismeldungen);

        await localPreismeldungenStatusDb.put({
            _id: 'preismeldungen_status',
            _rev: undefined,
            statusMap: {},
        } as P.PreismeldungenStatus);
        await dropRemoteCouchDatabaseAndSyncLocalToRemote(dbNames.preismeldungen_status);
        const adminUser = await this.loggedInUser$.pipe(take(1)).toPromise();
        await putAdminUserToDatabaseAsync(dbNames.preismeldungen_status, adminUser.username);
        await putAdminUserToDatabaseAsync(dbNames.preismeldungen, adminUser.username);

        return { type: 'IMPORT_PREISMELDUNGEN_SUCCESS', payload: pmInfo.preismeldungen } as importer.Action;
    }

    private importWarenkorb(data: { warenkorb: P.WarenkorbTreeItem[]; erhebungsmonat: string }) {
        return from(dropRemoteCouchDatabase('warenkorb')).pipe(
            flatMap(() =>
                getDatabase('warenkorb').then(db =>
                    db
                        .put({ _id: 'warenkorb', products: data.warenkorb })
                        .then<P.WarenkorbDocument>(_ => db.get('warenkorb'))
                        .then(warenkorb =>
                            db.put({ _id: 'erhebungsmonat', monthAsString: data.erhebungsmonat }).then(() => warenkorb),
                        ),
                ),
            ),
            flatMap(warenkorb =>
                this.updateImportMetadata(dbNames.warenkorb, importer.Type.warenkorb).pipe(map(() => warenkorb)),
            ),
            map(warenkorb => ({ type: 'IMPORT_WARENKORB_SUCCESS', payload: warenkorb } as importer.Action)),
        );
    }

    private importPreismeldestellen(pmsInfo: { preismeldestellen: P.Preismeldestelle[]; erhebungsmonat: string }) {
        return from(dropRemoteCouchDatabase(dbNames.preismeldestellen).catch(_ => null)).pipe(
            flatMap(() => getDatabase(dbNames.preismeldestellen)),
            flatMap(db => db.bulkDocs(pmsInfo.preismeldestellen).then(_ => db)),
            flatMap(db =>
                db
                    .put({ _id: 'erhebungsmonat', monthAsString: pmsInfo.erhebungsmonat })
                    .then(() => pmsInfo.preismeldestellen),
            ),
            flatMap(preismeldestellen =>
                this.updateImportMetadata(dbNames.preismeldestellen, importer.Type.preismeldestellen).pipe(
                    map(() => preismeldestellen),
                ),
            ),
            map(
                preismeldestellen =>
                    ({ type: 'IMPORT_PREISMELDESTELLEN_SUCCESS', payload: preismeldestellen } as importer.Action),
            ),
            catchError(error => of({ type: 'IMPORT_PREISMELDESTELLEN_FAILURE', payload: error.message })),
        );
    }

    private dropAndRecreateAllUserDbs() {
        return getDatabaseAsObservable(dbNames.preiserheber).pipe(
            flatMap(preiserheberDb => getAllDocumentsFromDb<P.Erheber>(preiserheberDb)),
            tap(preiserhebers => console.log('DEBUG: PREISERHEBERS:', preiserhebers.map(p => p._id))),
            flatMap(preiserhebers =>
                createUserDbs().pipe(
                    tap(x => console.log('DEBUG: AFTER CREATING USER DBS')),
                    map(error =>
                        !error
                            ? ({ type: 'IMPORTED_ALL_SUCCESS', payload: preiserhebers.length } as importer.Action)
                            : ({ type: 'IMPORTED_ALL_FAILURE', payload: error } as importer.Action),
                    ),
                ),
            ),
        );
    }

    private loadLatestImportedAt() {
        return getDatabaseAsObservable(dbNames.imports).pipe(
            flatMap(db =>
                db.allDocs({ include_docs: true }).then(result => result.rows.map(row => row.doc as P.LastImportAt)),
            ),
            map(
                latestImportedAtList =>
                    ({ type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS', payload: latestImportedAtList } as importer.Action),
            ),
        );
    }
}

async function loaderhebungsMonateAction() {
    const payload = await loaderhebungsMonate();
    return { type: 'LOAD_ERHEBUNGSMONATE_SUCCESS', payload };
}

async function loaderhebungsMonate() {
    const warenkorbDb = await getDatabase(dbNames.warenkorb);
    const warenkorbErhebungsmonat = await getErhebungsmonatDocument(warenkorbDb);

    const preismeldestelleDb = await getDatabase(dbNames.preismeldestellen);
    const preismeldestellenErhebungsmonat = await getErhebungsmonatDocument(preismeldestelleDb);

    const preismeldungDb = await getDatabase(dbNames.preismeldungen);
    const preismeldungenErhebungsmonat = await getErhebungsmonatDocument(preismeldungDb);

    return {
        warenkorbErhebungsmonat,
        preismeldestellenErhebungsmonat,
        preismeldungenErhebungsmonat,
    };
}

async function getErhebungsmonatDocument(db: PouchDB.Database<{}>) {
    try {
        const doc = await getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat');
        return doc.monthAsString;
    } catch (err) {
        return null;
    }
}
