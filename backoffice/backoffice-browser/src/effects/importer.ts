import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { chunk } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as importer from '../actions/importer';
import { dbNames, dropDatabase, getDatabase, putAdminUserToDatabase, dropLocalDatabase, getLocalDatabase, syncDb, getDatabaseAsObservable, getAllDocumentsFromDb } from './pouchdb-utils';
import { createUserDbs } from '../common/preiserheber-initialization';
import { continueEffectOnlyIfTrue, resetAndContinueWith } from '../common/effects-extensions';
import { readFileContents, parseCsv } from '../common/file-extensions';
import { preparePms, preparePm } from '../common/presta-data-mapper';
import { buildTree } from '../common/presta-warenkorb-mapper';

@Injectable()
export class ImporterEffects {
    loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    parseWarenkorbFile$ = this.actions$.ofType('PARSE_WARENKORB_FILE')
        .flatMap(action => readFileContents(action.payload.file).map(content => ({ action, content })))
        .map(({ action, content }) => ({ language: action.payload.language, data: parseCsv(content) }))
        .map(({ language, data }) => ({ type: 'PARSE_WARENKORB_FILE_SUCCESS', payload: { data, language } } as importer.Action));

    @Effect()
    parseFile$ = this.actions$.ofType('PARSE_FILE')
        .flatMap(action => readFileContents(action.payload.file).map(content => ({ action, content })))
        .map(({ action, content }) => ({ parsedType: action.payload.parseType, data: parseCsv(content) }))
        .map(({ parsedType, data }) => ({ type: 'PARSE_FILE_SUCCESS', payload: { data, parsedType } } as importer.Action));

    @Effect()
    importWarenkorb$ = this.actions$.ofType('IMPORT_WARENKORB')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .map(action => buildTree(action.payload))
        .flatMap(payload => dropDatabase('warenkorb').then(_ => payload))
        .flatMap(payload => getDatabase('warenkorb').then(db => db.put({ _id: 'warenkorb', products: payload })
            .then<P.WarenkorbDocument>(_ => db.get('warenkorb'))))
        .flatMap(warenkorb => this.updateImportMetadata(importer.Type.warenkorb).map(() => warenkorb))
        .map(warenkorb => ({ type: 'IMPORT_WARENKORB_SUCCESS', payload: warenkorb } as importer.Action));

    @Effect()
    importPreismeldestellen$ = this.actions$.ofType('IMPORT_PREISMELDESTELLEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .map(action => preparePms(action.payload))
        .catch(ex => {
            console.log(ex);
            return Observable.of({ preismeldestellen: [], erhebungsmonat: '' });
         })
        .flatMap(pmsInfo => dropDatabase(dbNames.preismeldestelle).then(_ => pmsInfo).catch(_ => pmsInfo))
        .flatMap(pmsInfo => getDatabase(dbNames.preismeldestelle).then(db => ({ pmsInfo, db })))
        .flatMap(({ pmsInfo, db }) => db.bulkDocs(pmsInfo.preismeldestellen).then(_ => ({ pmsInfo, db })))
        .flatMap(({ pmsInfo, db }) => db.put({ _id: 'erhebungsmonat', monthAsString: pmsInfo.erhebungsmonat }).then(() => pmsInfo.preismeldestellen))
        .flatMap(preismeldestellen => this.updateImportMetadata(importer.Type.preismeldestellen).map(() => preismeldestellen))
        .map(preismeldestellen => ({ type: 'IMPORT_PREISMELDESTELLEN_SUCCESS', payload: preismeldestellen } as importer.Action));

    @Effect()
    importPreismeldungen$ = this.actions$.ofType('IMPORT_PREISMELDUNGEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .map(action => preparePm(action.payload))
        .flatMap(pmInfo => dropLocalDatabase(dbNames.preismeldung).then(_ => pmInfo).catch(_ => pmInfo))
        .flatMap(pmInfo => getLocalDatabase(dbNames.preismeldung).then(db => ({ pmInfo, db })).catch(_ => ({ pmInfo, db: <PouchDB.Database<PouchDB.Core.Encodable>>null })))
        .flatMap(({ pmInfo, db }) =>
            Observable.from(chunk(pmInfo.preismeldungen, 6000).map(preismeldungenBatch => db.bulkDocs(preismeldungenBatch).then(_ => preismeldungenBatch.length)))
                .combineAll()
                .map(() => ({ pmInfo, db }))
        )
        .flatMap(({ pmInfo, db }) => db.put({ _id: 'erhebungsmonat', monthAsString: pmInfo.erhebungsmonat }).then(() => pmInfo.preismeldungen))
        .flatMap(preismeldungen => this.updateImportMetadata(importer.Type.preismeldungen).map(() => preismeldungen))
        .flatMap(preismeldungen => syncDb('preismeldungen').then(() => preismeldungen))
        .map(preismeldungen => ({ type: 'IMPORT_PREISMELDUNGEN_SUCCESS', payload: preismeldungen } as importer.Action));

    @Effect()
    loadLatestImportedAt$ = this.actions$.ofType('LOAD_LATEST_IMPORTED_AT')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabase(dbNames.import).then(db => db.allDocs({ include_docs: true }).then(result => result.rows.map(row => row.doc))))
        .map(latestImportedAtList => ({ type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS', payload: latestImportedAtList } as importer.Action));

    @Effect()
    importedAll = this.actions$.ofType('IMPORTED_ALL')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => resetAndContinueWith(
            { type: 'IMPORTED_ALL_RESET' },
            getDatabaseAsObservable(dbNames.preiserheber)
                .flatMap(preiserheberDb => getAllDocumentsFromDb<P.Erheber>(preiserheberDb))
                .flatMap(preiserhebers => preiserhebers.length > 0 ? createUserDbs(preiserhebers.map(p => p._id)) : Observable.of('Es sind keine Preiserheber erfasst'))
                .map(error => !error ?
                    { type: 'IMPORTED_ALL_SUCCESS' } as importer.Action :
                    { type: 'IMPORTED_ALL_FAILURE', payload: error } as importer.Action
                )
            )
        )

    private updateImportMetadata(importerType: string) {
        return this.loggedInUser$
            .take(1)
            .flatMap(user => putAdminUserToDatabase(dbNames.preismeldestelle, user.username))
            .flatMap(() => getDatabase(dbNames.import).then(db => db.get(importerType)
                .then(doc => doc._rev).catch(() => undefined)
                .then(_rev => db.put({ latestImportAt: new Date().valueOf(), _id: importerType, _rev })))
            );
    }
}
