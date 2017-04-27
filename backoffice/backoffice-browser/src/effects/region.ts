import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as region from '../actions/region';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { getDatabase, dbNames } from './pouchdb-utils';
import { CurrentRegion } from '../reducers/region';


@Injectable()
export class RegionEffects {
    currentRegion$ = this.store.select(fromRoot.getCurrentRegion);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadRegion$ = this.actions$.ofType('REGION_LOAD')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabase(dbNames.region).then(db => ({ db })))
        .filter(({ db }) => db != null)
        .flatMap(x => x.db.allDocs(Object.assign({}, { include_docs: true })).then(res => ({ regionen: res.rows.map(y => y.doc) as P.Region[] })))
        .map(docs => ({ type: 'REGION_LOAD_SUCCESS', payload: docs } as region.Action));

    @Effect()
    saveRegion$ = this.actions$.ofType('SAVE_REGION')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(this.currentRegion$, (action, currentRegion: CurrentRegion) => currentRegion)
        .flatMap(currentRegion =>
            getDatabase(dbNames.region)
                .then(db => { // Only check if the document exists if a revision already exists
                    if (!!currentRegion._rev) {
                        return db.get(currentRegion._id).then(doc => ({ db, doc }));
                    }
                    return Promise.resolve({ db, doc: {} });
                })
                .then(({ db, doc }) => { // Create or update the region
                    const create = !doc._rev;
                    const region = Object.assign({}, doc, <P.Region>{
                        _id: !create ? currentRegion._id : undefined,
                        _rev: currentRegion._rev,
                        name: currentRegion.name
                    });
                    return (create ? db.post(region) : db.put(region))
                        .then((response) => ({ db, id: response.id }));
                })
                .then<CurrentRegion>(({ db, id }) => db.get(id))
        )
        .map(payload => ({ type: 'SAVE_REGION_SUCCESS', payload } as region.Action));
}
