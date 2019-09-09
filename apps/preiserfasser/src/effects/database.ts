import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { chain } from 'lodash';
import { concat, from, of } from 'rxjs';
import { catchError, flatMap, map, take } from 'rxjs/operators';

import { Models as P, PreismeldungAction, preismeldungId } from '@lik-shared';

import { getDatabaseLastUploadedAt, setDatabaseLastUploadedAt } from './local-storage-utils';
import {
    checkConnectivity,
    checkIfDatabaseExists,
    downloadDatabase,
    dropDatabase,
    getAllDocumentsForPrefix,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
    syncDatabase,
    uploadDatabase,
} from './pouchdb-utils';

import { Actions as DatabaseAction } from '../actions/database';
import { Action as LoginAction } from '../actions/login';
import { Actions as PreismeldestelleAction } from '../actions/preismeldestellen';
import { Action as StatisticsAction } from '../actions/statistics';
import * as fromRoot from '../reducers';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    private resetActions = [
        { type: 'RESET_IS_LOGGED_IN_STATE' } as LoginAction,
        { type: 'RESET_DATABASE_SYNC_STATE' } as DatabaseAction,
        { type: 'PREISMELDESTELLEN_RESET' } as PreismeldestelleAction,
        { type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction, // Also affects PreismeldestellenAction
        { type: 'WARENKORB_RESET' },
        { type: 'PREISMELDUNG_STATISTICS_RESET' } as StatisticsAction,
    ];

    @Effect()
    getLastSyncedAt$ = this.actions$.ofType('LOAD_DATABASE_LAST_SYNCED_AT').pipe(
        flatMap(() =>
            getDatabase().then(db =>
                getDocumentByKeyFromDb(db, 'last-synced-at')
                    .then((doc: any) => doc.value)
                    .catch(() => null),
            ),
        ),
        map(
            (lastSyncedAt: string) =>
                ({ type: 'LOAD_DATABASE_LAST_SYNCED_AT_SUCCESS', payload: new Date(lastSyncedAt) } as DatabaseAction),
        ),
    );

    @Effect()
    checkConnectivity$ = this.actions$.ofType('CHECK_CONNECTIVITY_TO_DATABASE').pipe(
        flatMap(() =>
            concat(
                [{ type: 'RESET_CONNECTIVITY_TO_DATABASE' } as DatabaseAction],
                this.store.select(fromRoot.getSettings).pipe(
                    take(1),
                    flatMap(settings =>
                        !!settings && !settings.isDefault
                            ? checkConnectivity(settings.serverConnection.url).pipe(catchError(() => of(false)))
                            : of(false),
                    ),
                    map(isAlive => ({ type: 'SET_CONNECTIVITY_STATUS', payload: isAlive } as DatabaseAction)),
                ),
            ),
        ),
    );

    @Effect()
    syncDatabase$ = this.actions$.ofType('SYNC_DATABASE').pipe(
        flatMap(
            (action: DatabaseAction) =>
                concat(
                    [{ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction],
                    syncDatabase(action.payload).pipe(
                        flatMap(() =>
                            getDatabaseAsObservable().pipe(
                                flatMap(db =>
                                    db
                                        .get('last-synced-at')
                                        .then(doc => doc._rev)
                                        .catch(() => null)
                                        .then(_rev => {
                                            const lastSyncedAt = new Date();
                                            return db
                                                .put({ _id: 'last-synced-at', _rev, value: lastSyncedAt })
                                                .then(() => lastSyncedAt);
                                        }),
                                ),
                                flatMap(lastSyncedAt =>
                                    syncDatabase(action.payload).pipe(
                                        map(
                                            x =>
                                                ({
                                                    type: 'SYNC_DATABASE_SUCCESS',
                                                    payload: lastSyncedAt,
                                                } as DatabaseAction),
                                        ),
                                    ),
                                ),
                            ),
                        ),

                        catchError(error => this.convertErrorToActions(this.tryParseError(error))),
                    ),
                ),
            1,
        ),
    );

    @Effect()
    download$ = this.actions$.ofType('DOWNLOAD_DATABASE').pipe(
        flatMap((action: DatabaseAction) =>
            concat(
                [{ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction],
                downloadDatabase(action.payload).pipe(
                    map(() => ({ type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction)),
                    catchError(error => this.convertErrorToActions(this.tryParseError(error))),
                ),
            ),
        ),
    );

    @Effect()
    uploadDatabase$ = this.actions$.ofType('UPLOAD_DATABASE').pipe(
        flatMap((action: DatabaseAction) =>
            concat(
                [{ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction],
                this.updatePreismeldungen().pipe(
                    flatMap(() =>
                        uploadDatabase(action.payload).pipe(
                            flatMap(() => {
                                setDatabaseLastUploadedAt(new Date());
                                return [
                                    { type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction,
                                    {
                                        type: 'SET_DATABASE_LAST_UPLOADED_AT',
                                        payload: new Date(),
                                    } as DatabaseAction,
                                    { type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction,
                                ];
                            }),
                        ),
                    ),
                    catchError(error => from(this.convertErrorToActions(this.tryParseError(error)))),
                ),
            ),
        ),
    );

    @Effect()
    checkLastUploadedAt$ = this.actions$
        .ofType('CHECK_DATABASE_LAST_UPLOADED_AT')
        .pipe(map(() => ({ type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: getDatabaseLastUploadedAt() })));

    @Effect()
    checkDatabaseExists$ = this.actions$.ofType('CHECK_DATABASE_EXISTS').pipe(
        flatMap(() => checkIfDatabaseExists()),
        flatMap(exists => (!exists ? dropDatabase().then(() => exists) : [exists])), // drop database in case it's the wrong version
        flatMap(exists => [
            { type: 'SET_DATABASE_EXISTS', payload: exists },
            ...(exists ? [] : this.resetActions), // If the database does not exist, reset all data in store
        ]),
    );

    @Effect()
    deleteDatabase$ = this.actions$.ofType('DELETE_DATABASE').pipe(
        flatMap(() => dropDatabase()),
        flatMap(() => [{ type: 'SET_DATABASE_EXISTS', payload: false }, ...this.resetActions]),
    );

    private convertErrorToActions(errorText: string) {
        const actions: any[] = [{ type: 'SYNC_DATABASE_FAILURE', payload: errorText } as DatabaseAction];
        return errorText === 'error_request_unauthorized'
            ? [...actions, { type: 'SET_IS_LOGGED_OUT', payload: errorText } as LoginAction]
            : actions;
    }

    private tryParseError(error: { name: string; message: string; stack: string } | string) {
        if (typeof error === 'string') return error;
        if (!!error && !!error.name) {
            switch (error.name) {
                case 'unauthorized':
                    return 'error_request_unauthorized';
                case 'unknown':
                default:
                    return 'error_synchronize_unknown-error';
            }
        }
        if (!!error && !!error.message) {
            return error.message;
        }
        return 'error_synchronize_unknown-error';
    }

    private updatePreismeldungen() {
        return from(
            getDatabase().then(db =>
                db
                    .allDocs(Object.assign({}, getAllDocumentsForPrefix(preismeldungId()), { include_docs: true }))
                    .then(result =>
                        chain(result.rows)
                            .map(row => row.doc as P.Preismeldung)
                            .filter(p => p.istAbgebucht)
                            .map(p => Object.assign({}, p, { uploadRequestedAt: new Date() }))
                            .value(),
                    )
                    .then(preismeldungen => db.bulkDocs(preismeldungen)),
            ),
        );
    }
}
