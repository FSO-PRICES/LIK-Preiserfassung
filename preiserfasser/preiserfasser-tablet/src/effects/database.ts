import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { dropAndSyncDatabase } from './pouchdb-utils';

@Injectable()
export class DatabaseEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('DATABASE_SYNC')
        .switchMap(() => dropAndSyncDatabase())
        .mapTo({})
        .do(() => alert('sync complete'));
}
