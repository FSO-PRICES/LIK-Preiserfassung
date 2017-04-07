import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase } from './pouchdb-utils';

@Injectable()
export class WarenkorbEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadPreismeldestellen$ = this.actions$
        .ofType('LOAD_WARENKORB')
        .flatMap(() => getDatabase())
        .flatMap(db => db.get('warenkorb')
            .then((warenkorb: any) => ({ type: 'LOAD_WARENKORB_SUCCESS', payload: warenkorb.products }))
            .catch(() => ({ type: 'LOAD_WARENKORB_FAIL' }))
        );
}
