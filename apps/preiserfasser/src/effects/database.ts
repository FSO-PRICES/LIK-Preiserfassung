/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
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
    getLastSyncedAt$ = this.actions$.pipe(
        ofType('LOAD_DATABASE_LAST_SYNCED_AT'),
        flatMap(() =>
            from(
                getDatabase().then(db =>
                    getDocumentByKeyFromDb(db, 'last-synced-at')
                        .then((doc: any) => doc.value)
                        .catch(() => null),
                ),
            ).pipe(
                map(
                    (lastSyncedAt: string) =>
                        ({
                            type: 'LOAD_DATABASE_LAST_SYNCED_AT_SUCCESS',
                            payload: new Date(lastSyncedAt),
                        } as DatabaseAction),
                ),
                catchError(payload => of({ type: 'LOAD_DATABASE_LAST_SYNCED_FAILURE', payload })),
            ),
        ),
    );

    @Effect()
    checkConnectivity$ = this.actions$.pipe(
        ofType('CHECK_CONNECTIVITY_TO_DATABASE'),
        flatMap(() =>
            concat(
                [{ type: 'RESET_CONNECTIVITY_TO_DATABASE' } as DatabaseAction],
                this.store.select(fromRoot.getSettings).pipe(
                    take(1),
                    flatMap(settings =>
                        !!settings && !settings.isDefault
                            ? checkConnectivity(settings.serverConnection.url).pipe(
                                  catchError(() => of({ canConnect: false, isCompatible: null })),
                              )
                            : of({ canConnect: false, isCompatible: null }),
                    ),
                    flatMap(connectivity => [
                        { type: 'SET_CONNECTIVITY_STATUS', payload: connectivity.canConnect } as DatabaseAction,
                        { type: 'SET_COMPATIBILITY_STATUS', payload: connectivity.isCompatible } as DatabaseAction,
                    ]),
                ),
            ),
        ),
    );

    @Effect()
    syncDatabase$ = this.actions$.pipe(
        ofType('SYNC_DATABASE'),
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

                        catchError(error => from(this.convertErrorToActions(this.tryParseError(error)))),
                    ),
                ),
            1,
        ),
    );

    @Effect()
    download$ = this.actions$.pipe(
        ofType('DOWNLOAD_DATABASE'),
        flatMap((action: DatabaseAction) =>
            concat(
                [{ type: 'SET_DATABASE_IS_SYNCING' } as DatabaseAction],
                downloadDatabase(action.payload).pipe(
                    map(() => ({ type: 'SYNC_DATABASE_SUCCESS' } as DatabaseAction)),
                    catchError(error => from(this.convertErrorToActions(this.tryParseError(error)))),
                ),
            ),
        ),
    );

    @Effect()
    uploadDatabase$ = this.actions$.pipe(
        ofType('UPLOAD_DATABASE'),
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
    checkLastUploadedAt$ = this.actions$.pipe(
        ofType('CHECK_DATABASE_LAST_UPLOADED_AT'),
        map(() => ({ type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: getDatabaseLastUploadedAt() })),
    );

    @Effect()
    checkDatabaseExists$ = this.actions$.pipe(
        ofType('CHECK_DATABASE_EXISTS'),
        flatMap(() =>
            from(checkIfDatabaseExists()).pipe(
                flatMap(exists => (!exists ? dropDatabase().then(() => exists) : [exists])), // drop database in case it's the wrong version
                flatMap(exists => [
                    { type: 'SET_DATABASE_EXISTS', payload: exists },
                    ...(exists ? [] : this.resetActions), // If the database does not exist, reset all data in store
                ]),
                catchError(payload => of({ type: 'CHECK_DATABASE_FAILURE', payload })),
            ),
        ),
    );

    @Effect()
    deleteDatabase$ = this.actions$.pipe(
        ofType('DELETE_DATABASE'),
        flatMap(() =>
            from(dropDatabase()).pipe(
                flatMap(() => [{ type: 'SET_DATABASE_EXISTS', payload: false }, ...this.resetActions]),
                catchError(payload => of({ type: 'DELETE_DATABASE_FAILURE', payload })),
            ),
        ),
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
        console.warn('An unkown couchdb sync error occured:');
        console.error(error);
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
