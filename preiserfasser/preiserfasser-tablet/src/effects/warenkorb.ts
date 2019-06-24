import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';

import { flatMap } from 'rxjs/operators';
import { getDatabase } from './pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    constructor(private actions$: Actions) {}

    @Effect()
    loadPreismeldestellen$ = this.actions$.ofType('LOAD_WARENKORB').pipe(
        flatMap(() => getDatabase()),
        flatMap(db =>
            db
                .get('warenkorb')
                .then((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
                .catch(() => ({ type: 'LOAD_WARENKORB_FAIL' })),
        ),
    );
}
