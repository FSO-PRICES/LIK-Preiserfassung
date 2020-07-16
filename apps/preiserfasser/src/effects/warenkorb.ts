import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';

import { exhaustMap, flatMap } from 'rxjs/operators';
import { getDatabase } from './pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    constructor(private actions$: Actions) {}

    @Effect()
    loadPreismeldestellen$ = this.actions$.pipe(
        ofType('LOAD_WARENKORB'),
        exhaustMap(() => getDatabase()),
        flatMap(db =>
            db
                .get('warenkorb')
                .then((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
                .catch(payload => ({ type: 'LOAD_WARENKORB_FAIL', payload })),
        ),
    );
}
