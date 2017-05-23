import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as region from '../actions/region';
import { getDatabase } from './pouchdb-utils';


@Injectable()
export class RegionEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadRegion$ = this.actions$.ofType('REGION_LOAD')
        .flatMap(() => getDatabase())
        .filter(db => db != null)
        .flatMap(db => db.get('regionen').then((result: { regionen: P.Region[] } & P.CouchProperties) => result.regionen) as Promise<P.Region[]>)
        .map(regionen => ({ type: 'REGION_LOAD_SUCCESS', payload: regionen } as region.Action));
}
