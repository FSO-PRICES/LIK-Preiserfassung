import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, flatMap, map } from 'rxjs/operators';

import { blockIfNotLoggedIn } from '../common/effects-extensions';
import { dbNames, getDatabaseAsObservable } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class WarenkorbEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadWarenkorb$ = this.actions$.ofType('LOAD_WARENKORB').pipe(
        blockIfNotLoggedIn(this.store),
        flatMap(() =>
            getDatabaseAsObservable(dbNames.warenkorb).pipe(
                flatMap(db => db.get('warenkorb')),
                map((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products })),
                catchError(() => of({ type: 'LOAD_WARENKORB_FAIL' })),
            ),
        ),
    );
}
