import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { chain } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabaseLastUploadedAt, setDatabaseLastUploadedAt } from './local-storage-utils';
import { checkIfDatabaseExists, checkConnectivity, getDatabase, dropDatabase, downloadDatabase, getAllDocumentsForPrefix, uploadDatabase, syncDatabase } from './pouchdb-utils';

import { Actions as DatabaseAction } from '../actions/database';
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
        .flatMap(() =>
            Observable.of({ type: 'RESET_CONNECTIVITY_TO_DATABASE' } as DatabaseAction)
                .concat(this.store.select(fromRoot.getSettings).take(1)
                    .flatMap(settings => !!settings && !settings.isDefault ?
                        checkConnectivity(settings.serverConnection.url).catch(() => Observable.of(false)) :
                        Observable.of(false)
                    )
                    .map(isAlive => ({ type: 'SET_CONNECTIVITY_STATUS', payload: isAlive } as DatabaseAction))
                )
        );

    @Effect()
    syncDatabase$ = this.actions$
        .ofType('SYNC_DATABASE')
        .flatMap(action => Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
            .concat(syncDatabase(action.payload)
                .map(() => ({ type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction))
            )
            .catch(error => Observable.of({ type: 'SYNC_DATABASE_FAILURE', payload: this.tryParseError(error) } as DatabaseAction))
    );

    @Effect()
    download$ = this.actions$
        .ofType('DOWNLOAD_DATABASE')
        .flatMap(action => Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
            .concat(downloadDatabase(action.payload)
                .map(() => ({ type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction))
            )
            .catch(error => Observable.of({ type: 'SYNC_DATABASE_FAILURE', payload: this.tryParseError(error) } as DatabaseAction))
        );

    @Effect()
    uploadDatabase$ = this.actions$
        .ofType('UPLOAD_DATABASE')
        .flatMap(action => Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
            .concat(this.updatePreismeldungen().delay(4000)
                .flatMap(() =>
                    uploadDatabase(action.payload)
                        .flatMap(() => {
                            setDatabaseLastUploadedAt(new Date());
                            return [
                                { type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: new Date() } as DatabaseAction,
                                { type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction
                            ];
                        })
                )
                .catch(error => Observable.of({ type: 'SYNC_DATABASE_FAILURE', payload: this.tryParseError(error) } as DatabaseAction))
            )
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

    private tryParseError(error: { name: string, message: string, stack: string }) {
        if (!!error && !!error.name) {
            switch (error.name) {
                case 'unknown':
                default:
                    return 'Unkown error occured, please try again later or contact an administrator';
            }
        }
        if (!!error && !!error.message) {
            return error.message;
        }
        return error;
    }

    private updatePreismeldungen() {
        return Observable.fromPromise(
            getDatabase()
                .then(db => db.allDocs(Object.assign({}, getAllDocumentsForPrefix('pm'), { include_docs: true }))
                    .then(result => chain(result.rows)
                        .map(row => row.doc as P.Preismeldung)
                        .filter(p => p.istAbgebucht)
                        .map(p => Object.assign({}, p, { uploadRequestedAt: new Date() }))
                        .value()
                    )
                    .then(preismeldungen => db.bulkDocs(preismeldungen))
                )
        );
    }
}
