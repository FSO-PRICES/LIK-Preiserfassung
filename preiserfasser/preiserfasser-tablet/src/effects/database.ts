import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { checkIfDatabaseExists, checkConnectivity, dropAndSyncDatabase, dropDatabase } from './pouchdb-utils';

import { Actions as PreismeldestelleAction } from '../actions/preismeldestellen';
import { Actions as PreismeldungAction } from '../actions/preismeldungen';
import * as fromRoot from '../reducers';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) { }

    private resetActions = [
        { type: 'PREISMELDESTELLEN_RESET' } as PreismeldestelleAction,
        { type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction, // Also affects PreismeldestellenAction
        { type: 'WARENKORB_RESET' }
    ]

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
        .ofType('DATABASE_SYNC')
        .switchMap(x => dropAndSyncDatabase(x.payload)
            .then(() => ({ type: 'SET_DATABASE_EXISTS', payload: true }))
            .catch(() => dropDatabase().then(() => ({ type: 'SET_DATABASE_EXISTS', payload: false })))
        );

    @Effect()
    checkDatabaseExists$ = this.actions$
        .ofType('CHECK_DATABASE_EXISTS')
        .flatMap(() => checkIfDatabaseExists())
        .flatMap(exists => [
            { type: 'SET_DATABASE_EXISTS', payload: exists },
            ...exists ? [] : this.resetActions // If the database does not exists, reset all data in store
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
