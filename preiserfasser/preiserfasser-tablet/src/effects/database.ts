import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { chain } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabaseLastUploadedAt, setDatabaseLastUploadedAt } from './local-storage-utils';
import { checkIfDatabaseExists, checkConnectivity, getDatabase, getDatabaseAsObservable, dropDatabase, downloadDatabase, getAllDocumentsForPrefix, uploadDatabase, syncDatabase, getDocumentByKeyFromDb } from './pouchdb-utils';

import { Actions as DatabaseAction } from '../actions/database';
import { Actions as PreismeldestelleAction } from '../actions/preismeldestellen';
import { Actions as PreismeldungAction } from '../actions/preismeldungen';
import { Action as LoginAction } from '../actions/login';
import { Action as StatisticsAction } from '../actions/statistics';
import * as fromRoot from '../reducers';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>, private translate: TranslateService) { }

    private resetActions = [
        { type: 'PREISMELDESTELLEN_RESET' } as PreismeldestelleAction,
        { type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction, // Also affects PreismeldestellenAction
        { type: 'WARENKORB_RESET' },
        { type: 'PREISMELDUNG_STATISTICS_RESET' } as StatisticsAction
    ];

    @Effect()
    getLastSyncedAt$ = this.actions$
        .ofType('LOAD_DATABASE_LAST_SYNCED_AT')
        .flatMap(() => getDatabase().then(db => getDocumentByKeyFromDb(db, 'last-synced-at').then((doc: any) => doc.value).catch(() => null)))
        .map(lastSyncedAt => ({ type: 'LOAD_DATABASE_LAST_SYNCED_AT_SUCCESS', payload: lastSyncedAt }));

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
        .flatMap(action =>
            Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
                .concat(syncDatabase(action.payload)
                    .flatMap(result => result.didSync
                        ? getDatabaseAsObservable()
                            .flatMap(db => db.get('last-synced-at').then(doc => doc._rev).catch(() => null)
                                .then(_rev => {
                                    const lastSyncedAt = new Date();
                                    return db.put({ _id: 'last-synced-at', _rev, value: lastSyncedAt }).then(() => lastSyncedAt);
                                })
                            )
                            .flatMap(lastSyncedAt => syncDatabase(action.payload).map(() => lastSyncedAt)) // Sync synced at
                            .map(lastSyncedAt => ({ type: 'SYNC_DATABASE_SUCCESS', payload: lastSyncedAt } as DatabaseAction))
                            .catch(error => Observable.from(this.convertErrorToActions(error)))
                        : Observable.of({ type: 'SYNC_DATABASE_FAILURE', payload: 'Mismatch in user-db-id' })
                    )
                ), 1 // limit concurrency
        );

    @Effect()
    download$ = this.actions$
        .ofType('DOWNLOAD_DATABASE')
        .flatMap(action => Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
            .concat(downloadDatabase(action.payload)
                .map(() => ({ type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction))
                .catch(error => Observable.from(this.convertErrorToActions(error)))
            )
        );

    @Effect()
    uploadDatabase$ = this.actions$
        .ofType('UPLOAD_DATABASE')
        .flatMap(action => Observable.of({ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction)
            .concat(this.updatePreismeldungen()
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
                .catch(error => Observable.from(this.convertErrorToActions(error)))
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
                case 'unauthorized':
                    return this.translate.instant('error_request_unauthorized');
                case 'unknown':
                default:
                    return this.translate.instant('error_synchronize_unknown-error');
            }
        }
        if (!!error && !!error.message) {
            return error.message;
        }
        return error;
    }

    private convertErrorToActions(error, ) {
        const errorText = this.tryParseError(error);
        const actions: any[] = [{ type: 'SYNC_DATABASE_FAILURE', payload: errorText } as DatabaseAction]
        if (!!error && error.status === 401) { // Append logged out action if an unauthorized response was returned
            actions.push({ type: 'SET_IS_LOGGED_OUT', payload: errorText } as LoginAction)
        }
        return actions;
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
