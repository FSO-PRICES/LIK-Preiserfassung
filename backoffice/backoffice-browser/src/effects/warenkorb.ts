import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import * as fromRoot from '../reducers';
import { dbNames, getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadWarenkorb$ = this.actions$.ofType('LOAD_WARENKORB')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => getDatabaseAsObservable(dbNames.warenkorb)
            .flatMap(db => db.get('warenkorb'))
            .map((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
            .catch(err => Observable.of({ type: 'LOAD_WARENKORB_FAIL' }))
        );
}
