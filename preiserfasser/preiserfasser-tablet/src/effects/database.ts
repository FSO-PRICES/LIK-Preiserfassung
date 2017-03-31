import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { checkIfDatabaseExists, dropAndSyncDatabase, dropDatabase } from './pouchdb-utils';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('DATABASE_SYNC')
        .switchMap(x => dropAndSyncDatabase(x.payload)
            .then(() => ({ type: 'SET_DATABASE_EXISTS', payload: true }))
            .catch(() => dropDatabase().then(() => ({ type: 'SET_DATABASE_EXISTS', payload: false }))));

    @Effect()
    checkDatabaseExists$ = this.actions$
        .ofType('CHECK_DATABASE_EXISTS')
        .flatMap(() => checkIfDatabaseExists())
        .map(exists => ({ type: 'SET_DATABASE_EXISTS', payload: exists }));

    @Effect()
    deleteDatabase$ = this.actions$
        .ofType('DELETE_DATABASE')
        .flatMap(() => dropDatabase())
        .mapTo({ type: 'SET_DATABASE_EXISTS', payload: false });
        // .map(exists => ({ type: 'SET_DATABASE_EXISTS', payload: false }))
}
