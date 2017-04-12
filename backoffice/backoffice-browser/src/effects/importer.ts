import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { chunk } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as importer from '../actions/importer';
import { dbNames, dropDatabase, getDatabase, putAdminUserToDatabase, dropLocalDatabase, getLocalDatabase, syncDb } from './pouchdb-utils';
import { readFileContents, parseCsv } from '../common/file-extensions';
import { preparePms, preparePm } from '../common/presta-data-mapper';
import { buildTree } from '../common/presta-warenkorb-mapper';

@Injectable()
export class ImporterEffects {
    loggedInUser$ = this.store.select(fromRoot.getLoggedInUser);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    parseWarenkorbFile$ = this.actions$
        .ofType('PARSE_WARENKORB_FILE')
        .flatMap(action => readFileContents(action.payload.file).map(content => ({ action, content })))
        .map(({ action, content }) => ({ language: action.payload.language, data: parseCsv(content) }))
        .map(({ language, data }) => ({ type: 'PARSE_WARENKORB_FILE_SUCCESS', payload: { data, language } } as importer.Action));

    @Effect()
    parseFile$ = this.actions$
        .ofType('PARSE_FILE')
        .flatMap(action => readFileContents(action.payload.file).map(content => ({ action, content })))
        .map(({ action, content }) => ({ parsedType: action.payload.parseType, data: parseCsv(content) }))
        .map(({ parsedType, data }) => ({ type: 'PARSE_FILE_SUCCESS', payload: { data, parsedType } } as importer.Action));

    @Effect()
    importWarenkorb$ = this.actions$
        .ofType('IMPORT_WARENKORB')
        .map(action => buildTree(action.payload))
        .flatMap(payload => dropDatabase('warenkorb').then(_ => payload))
        .flatMap(payload => getDatabase('warenkorb').then(db => db.put({ _id: 'warenkorb', products: payload })
            .then<P.WarenkorbDocument>(_ => db.get('warenkorb'))))
        .flatMap(warenkorb => this.updateImportMetadata(importer.Type.warenkorb).mapTo(warenkorb))
        .map(warenkorb => ({ type: 'IMPORT_WARENKORB_SUCCESS', payload: warenkorb } as importer.Action));

    @Effect()
    importPreismeldestellen$ = this.actions$
        .ofType('IMPORT_PREISMELDESTELLEN')
        .map(action => preparePms(action.payload))
        .flatMap(x => dropDatabase(dbNames.preismeldestelle).then(_ => x).catch(_ => x))
        .flatMap(x => getDatabase(dbNames.preismeldestelle).then(db => ({ preismeldestellen: x, db })).catch(_ => ({ preismeldestellen: x, db: <PouchDB.Database<PouchDB.Core.Encodable>>null })))
        .flatMap(({ preismeldestellen, db }) => Observable.fromPromise(db.bulkDocs(preismeldestellen).then(_ => preismeldestellen)))
        .flatMap(preismeldestellen => this.updateImportMetadata(importer.Type.preismeldestellen).mapTo(preismeldestellen))
        .map(preismeldestellen => ({ type: 'IMPORT_PREISMELDESTELLEN_SUCCESS', payload: preismeldestellen } as importer.Action));

    @Effect()
    importPreismeldungen$ = this.actions$
        .ofType('IMPORT_PREISMELDUNGEN')
        .map(action => preparePm(action.payload))
        .flatMap(x => dropLocalDatabase(dbNames.preismeldung).then(_ => x).catch(_ => x))
        .flatMap(x => getLocalDatabase(dbNames.preismeldung).then(db => ({ preismeldungen: x, db })).catch(_ => ({ preismeldungen: x, db: <PouchDB.Database<PouchDB.Core.Encodable>>null })))
        .flatMap(({ preismeldungen, db }) =>
            Observable.from(
                chunk(preismeldungen, 6000).map(preismeldungenBatch => db.bulkDocs(preismeldungenBatch).then(_ => preismeldungenBatch.length))
            )
                .combineAll()
                .mapTo(preismeldungen)
        )
        .flatMap(preismeldungen => this.updateImportMetadata(importer.Type.preismeldestellen).mapTo(preismeldungen))
        .flatMap(x => Observable.fromPromise(syncDb('preismeldungen').then(() => x)))
        .map(preismeldungen => ({ type: 'IMPORT_PREISMELDUNGEN_SUCCESS', payload: preismeldungen } as importer.Action));

    @Effect()
    loadLatestImportedAt$ = this.actions$
        .ofType('LOAD_LATEST_IMPORTED_AT')
        .switchMap(() => getDatabase(dbNames.import).then(db => db.allDocs({ include_docs: true }).then(result => result.rows.map(row => row.doc))))
        .map(latestImportedAtList => ({ type: 'LOAD_LATEST_IMPORTED_AT_SUCCESS', payload: latestImportedAtList } as importer.Action));

    private updateImportMetadata(importerType: string) {
        const updateMetadataActions$ = this.loggedInUser$
            .flatMap(user => putAdminUserToDatabase(dbNames.preismeldestelle, user.username))
            .flatMap(() => getDatabase(dbNames.import).then(db => db.get(importerType)
                .then(doc => doc._rev).catch(() => undefined)
                .then(_rev => db.put({ latestImportAt: new Date().valueOf(), _id: importerType, _rev })))
            );

        return updateMetadataActions$;
    }
}
