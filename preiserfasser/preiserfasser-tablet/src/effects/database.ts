import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { chain } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabaseLastUploadedAt, setDatabaseLastUploadedAt } from './local-storage-utils';
import { checkIfDatabaseExists, checkConnectivity, getDatabase, dropDatabase, downloadDatabase, uploadDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';

import { Actions as PreismeldestelleAction } from '../actions/preismeldestellen';
import { Actions as PreismeldungAction } from '../actions/preismeldungen';
import { Action as StatisticsAction } from '../actions/statistics';
import * as fromRoot from '../reducers';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) { }

    private resetActions = [
        { type: 'PREISMELDESTELLEN_RESET' } as PreismeldestelleAction,
        { type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction, // Also affects PreismeldestellenAction
        { type: 'WARENKORB_RESET' },
        { type: 'PREISMELDUNG_STATISTICS_RESET' } as StatisticsAction
    ];

    @Effect()
    checkConnectivity$ = this.actions$
        .ofType('CHECK_CONNECTIVITY_TO_DATABASE')
        .withLatestFrom(this.store.select(fromRoot.getSettings), (_, settings) => settings)
        .flatMap(settings => !!settings && !settings.isDefault ?
            checkConnectivity(settings.serverConnection.url)
                .catch(() => Observable.of(false)) :
            Observable.of(false)
        )
        .map(isAlive => ({ type: 'SET_CONNECTIVITY_STATUS', payload: isAlive }));

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('DOWNLOAD_DATABASE')
        .flatMap(x => downloadDatabase(x.payload)
            .then(() => ({ type: 'SET_DATABASE_EXISTS', payload: true }))
            .catch(() => ({ type: 'SET_DATABASE_EXISTS', payload: false }))
        );

    @Effect()
    uploadPreismeldestellen$ = this.actions$
        .ofType('UPLOAD_DATABASE')
        .switchMap(action => {
            const uploadRequestedAt = new Date();
            return getDatabase()
                .then(db => db.allDocs(Object.assign({}, getAllDocumentsForPrefix('pm'), { include_docs: true }))
                    .then(result => chain(result.rows)
                        .map(row => row.doc as P.Preismeldung)
                        .filter(p => p.istAbgebucht)
                        .map(p => Object.assign({}, p, { uploadRequestedAt }))
                        .value()
                    )
                    .then(preismeldungen => db.bulkDocs(preismeldungen))
                )
                .then(() => ({ credentials: action.payload }));
        })
        .flatMap(({ credentials }) => uploadDatabase(credentials)
            .then(() => setDatabaseLastUploadedAt(new Date()))
            .then(() => ({ type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: new Date() }))
        );

    @Effect()
    checkLastUploadedAt$ = this.actions$
        .ofType('CHECK_DATABASE_LAST_UPLOADED_AT')
        .map(() => ({ type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: getDatabaseLastUploadedAt() }));

    @Effect()
    checkDatabaseExists$ = this.actions$
        .ofType('CHECK_DATABASE_EXISTS')
        .flatMap(() => checkIfDatabaseExists())
        .flatMap(exists => !exists ? dropDatabase().then(() => exists) : [exists]) // drop database in case it's the wrong version
        .flatMap(exists => [
            { type: 'SET_DATABASE_EXISTS', payload: exists },
            ...(exists ? [] : this.resetActions) // If the database does not exist, reset all data in store
        ]);

    @Effect()
    deleteDatabase$ = this.actions$
        .ofType('DELETE_DATABASE')
        .flatMap(() => dropDatabase())
        .flatMap(() => [
            { type: 'SET_DATABASE_EXISTS', payload: false },
            ... this.resetActions
        ]);
}
