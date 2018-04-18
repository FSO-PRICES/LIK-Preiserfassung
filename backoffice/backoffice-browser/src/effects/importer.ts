import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { chunk, assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as importer from '../actions/importer';
import {
    dbNames,
    dropRemoteCouchDatabase,
    getDatabase,
    putAdminUserToDatabase,
    dropLocalDatabase,
    getLocalDatabase,
    dropRemoteCouchDatabaseAndSyncLocalToRemote,
    getDatabaseAsObservable,
    getAllDocumentsFromDb,
    getDocumentByKeyFromDb,
} from '../common/pouchdb-utils';
import { createUserDbs } from '../common/preiserheber-initialization';
import { continueEffectOnlyIfTrue, doAsyncAsObservable } from '../common/effects-extensions';
import { parseCsvAsObservable } from '../common/file-extensions';
import { preparePms, preparePm } from '../common/presta-data-mapper';
import { buildTree } from '../common/presta-warenkorb-mapper';

@Injectable()
export class ImporterEffects {
    loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    parseWarenkorbFile$ = this.actions$.ofType('PARSE_WARENKORB_FILE').flatMap(action => {
        if (action.payload.file == null) {
            return Observable.of({
                type: 'PARSE_WARENKORB_FILE_SUCCESS',
                payload: { data: null, language: action.payload.language },
            } as importer.Action);
        }
        return parseCsvAsObservable(action.payload.file)
            .map(data => ({ language: action.payload.language, data }))
            .map(
                ({ language, data }) =>
                    ({ type: 'PARSE_WARENKORB_FILE_SUCCESS', payload: { data, language } } as importer.Action)
            );
    });

    @Effect()
    parseFile$ = this.actions$.ofType('PARSE_FILE').flatMap(action => {
        if (action.payload.file == null) {
            return Observable.of({
                type: 'PARSE_FILE_SUCCESS',
                payload: { data: null, parsedType: action.payload.parseType },
            } as importer.Action);
        }
        return parseCsvAsObservable(action.payload.file)
            .map(data => ({ parsedType: action.payload.parseType, data }))
            .map(
                ({ parsedType, data }) =>
                    ({ type: 'PARSE_FILE_SUCCESS', payload: { data, parsedType } } as importer.Action)
            );
    });

    @Effect()
    importWarenkorb$ = this.actions$
        .ofType('IMPORT_WARENKORB')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .map(action => buildTree(action.payload))
        .flatMap(data => dropRemoteCouchDatabase(dbNames.warenkorb).then(_ => data))
        .flatMap(data =>
            getDatabase('warenkorb').then(db =>
                db
                    .put({ _id: 'warenkorb', products: data.warenkorb })
                    .then<P.WarenkorbDocument>(_ => db.get(dbNames.warenkorb))
                    .then(warenkorb =>
                        db.put({ _id: 'erhebungsmonat', monthAsString: data.erhebungsmonat }).then(() => warenkorb)
                    )
            )
        )
        .flatMap(warenkorb =>
            this.updateImportMetadata(dbNames.warenkorb, importer.Type.warenkorb).map(() => warenkorb)
        )
        .map(warenkorb => ({ type: 'IMPORT_WARENKORB_SUCCESS', payload: warenkorb } as importer.Action));

    @Effect()
    import$ = this.actions$
        .ofType('IMPORT_DATA')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .map(action => action.payload)
        .flatMap(({ parsedPreismeldungen, parsedPreismeldestellen, parsedWarenkorb }) =>
            Observable.concat(
                [{ type: 'IMPORT_STARTED' }],
                Observable.from(dropRemoteCouchDatabase(dbNames.exports))
                    .flatMap(() => this.importPreismeldungen(parsedPreismeldungen))
                    .do(x => console.log('1. IMPORTPREISMELDESTELLEN'))
                    .flatMap(importPreismeldungAction =>
                        this.importPreismeldestellen(parsedPreismeldestellen).map(importPreismeldestellenAction => [
                            importPreismeldungAction,
                            importPreismeldestellenAction,
                        ])
                    )
                    .do(x => console.log('2. IMPORTWARENKORB'))
                    .flatMap(actions =>
                        this.importWarenkorb(parsedWarenkorb).map(importWarenkorbAction => [
                            ...actions,
                            importWarenkorbAction,
                        ])
                    )
                    .do(x => console.log('3. DROPANDRECREATEALLUSERDBS'))
                    .flatMap(actions => this.dropAndRecreateAllUserDbs().map(action => [action, ...actions]))
                    .do(x => console.log('4. UPDATEIMPORTMETADATA'))
                    .flatMap(actions => this.updateImportMetadata(null, importer.Type.all_data).map(() => actions))
                    .do(x => console.log('5. LOADLATESTIMPORTEDAT'))
                    .flatMap(actions => this.loadLatestImportedAt().map(action => [action, ...actions]))
                    .flatMap(actions => loaderhebungsMonateAction().then(action => [action, ...actions]))
                    .do(x => console.log('6. ACTIONS', x))
                    .flatMap(actions => actions)
            )
        );

    @Effect()
    loadLatestImportedAt$ = this.actions$
        .ofType('LOAD_LATEST_IMPORTED_AT')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => this.loadLatestImportedAt());

    @Effect()
    loadErhebungsmonate$ = this.actions$
        .ofType('LOAD_ERHEBUNGSMONATE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loaderhebungsMonateAction());

    private updateImportMetadata(dbName: string, importerType: string) {
        return this.loggedInUser$
            .take(1)
            .flatMap(user => (dbName === null ? Observable.of(null) : putAdminUserToDatabase(dbName, user.username)))
            .flatMap(() =>
                getDatabase(dbNames.import).then(db =>
                    db
                        .get(importerType)
                        .then(doc => doc._rev)
                        .catch(() => undefined)
                        .then(_rev => db.put({ latestImportAt: new Date().valueOf(), _id: importerType, _rev }))
                )
            );
    }

    private importPreismeldungen(parsedPreismeldungen: string[][]) {
        return Observable.fromPromise(dropLocalDatabase(dbNames.preismeldung))
            .do(x => console.log('DEBUG: DROPPED LOCAL PREISMELDUNG DB'))
            .flatMap(() => getLocalDatabase(dbNames.preismeldung))
            .do(x => console.log('DEBUG: CREATED LOCAL PREISMELDUNG DB'))
            .flatMap(db => {
                const pmInfo = preparePm(parsedPreismeldungen);
                console.log('DEBUG: PREPARED PREISMELDUNGEN');
                return Observable.from(
                    chunk(pmInfo.preismeldungen, 6000).map(preismeldungenBatch =>
                        db
                            .bulkDocs(preismeldungenBatch)
                            .then(_ => preismeldungenBatch.length)
                            .catch(err => console.log('error is', err))
                    )
                )
                    .combineAll()
                    .do(x => console.log('DEBUG: OUTPUT FROM CHUNKING', x))
                    .map(() => ({ pmInfo, db }));
            })
            .do(x => console.log('DEBUG: AFTER WRITING PREISMELDUNGEN TO LOCAL DB'))
            .flatMap(({ pmInfo, db }) =>
                db
                    .put({ _id: 'erhebungsmonat', monthAsString: pmInfo.erhebungsmonat })
                    .then(() => pmInfo.preismeldungen)
            )
            .do(x => console.log('DEBUG: AFTER WRITING ERHEBUNGSMONAT TO LOCAL DB, ABOUT TO SYNC'))
            .flatMap(preismeldungen =>
                dropRemoteCouchDatabaseAndSyncLocalToRemote('preismeldungen').then(() => preismeldungen)
            )
            .do(x => console.log('DEBUG: AFTER SYNC'))
            .flatMap(preismeldungen =>
                this.updateImportMetadata(dbNames.preismeldung, importer.Type.preismeldungen).map(() => preismeldungen)
            )
            .do(x => console.log('DEBUG: AFTER UPDATING METADATA'))
            .map(
                preismeldungen =>
                    ({ type: 'IMPORT_PREISMELDUNGEN_SUCCESS', payload: preismeldungen } as importer.Action)
            );
    }

    private importWarenkorb(parsedWarenkorb: { de: string[][]; fr: string[][]; it: string[][] }) {
        const data = buildTree(parsedWarenkorb);
        return Observable.fromPromise(dropRemoteCouchDatabase('warenkorb'))
            .flatMap(() =>
                getDatabase('warenkorb').then(db =>
                    db
                        .put({ _id: 'warenkorb', products: data.warenkorb })
                        .then<P.WarenkorbDocument>(_ => db.get('warenkorb'))
                        .then(warenkorb =>
                            db.put({ _id: 'erhebungsmonat', monthAsString: data.erhebungsmonat }).then(() => warenkorb)
                        )
                )
            )
            .flatMap(warenkorb =>
                this.updateImportMetadata(dbNames.warenkorb, importer.Type.warenkorb).map(() => warenkorb)
            )
            .map(warenkorb => ({ type: 'IMPORT_WARENKORB_SUCCESS', payload: warenkorb } as importer.Action));
    }

    private importPreismeldestellen(parsedPreismeldestellen: string[][]) {
        return Observable.fromPromise(dropRemoteCouchDatabase(dbNames.preismeldestelle).catch(_ => null))
            .flatMap(() => getDatabase(dbNames.preismeldestelle))
            .flatMap(db =>
                doAsyncAsObservable(() => preparePms(parsedPreismeldestellen)).map(pmsInfo => ({ pmsInfo, db }))
            )
            .flatMap(({ pmsInfo, db }) => db.bulkDocs(pmsInfo.preismeldestellen).then(_ => ({ pmsInfo, db })))
            .flatMap(({ pmsInfo, db }) =>
                db
                    .put({ _id: 'erhebungsmonat', monthAsString: pmsInfo.erhebungsmonat })
                    .then(() => pmsInfo.preismeldestellen)
            )
            .flatMap(preismeldestellen =>
                this.updateImportMetadata(dbNames.preismeldestelle, importer.Type.preismeldestellen).map(
                    () => preismeldestellen
                )
            )
            .map(
                preismeldestellen =>
                    ({ type: 'IMPORT_PREISMELDESTELLEN_SUCCESS', payload: preismeldestellen } as importer.Action)
            )
            .catch(error => Observable.of({ type: 'IMPORT_PREISMELDESTELLEN_FAILURE', payload: error.message }));
    }

    private dropAndRecreateAllUserDbs() {
        return getDatabaseAsObservable(dbNames.preiserheber)
            .flatMap(preiserheberDb => getAllDocumentsFromDb<P.Erheber>(preiserheberDb))
            .do(preiserhebers => console.log('DEBUG: PREISERHEBERS:', preiserhebers.map(p => p._id)))
            .flatMap(preiserhebers =>
                createUserDbs(preiserhebers.map(p => p._id))
                    .do(x => console.log('DEBUG: AFTER CREATING USER DBS'))
                    .map(
                        error =>
                            !error
                                ? ({ type: 'IMPORTED_ALL_SUCCESS', payload: preiserhebers.length } as importer.Action)
                                : ({ type: 'IMPORTED_ALL_FAILURE', payload: error } as importer.Action)
                    )
            );
    }

    private loadLatestImportedAt() {
        return getDatabaseAsObservable(dbNames.import)
            .flatMap(db =>
                db.allDocs({ include_docs: true }).then(result => result.rows.map(row => row.doc as P.LastImportAt))
            )
            .map(
                latestImportedAtList =>
                    ({ type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS', payload: latestImportedAtList } as importer.Action)
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

    const preismeldestelleDb = await getDatabase(dbNames.preismeldestelle);
    const preismeldestellenErhebungsmonat = await getErhebungsmonatDocument(preismeldestelleDb);

    const preismeldungDb = await getDatabase(dbNames.preismeldung);
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
