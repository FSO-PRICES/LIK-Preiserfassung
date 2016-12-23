import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';

@Injectable()
export class ProductEffects {
    constructor(private actions$: Actions) { }

    @Effect()
    loadProducts$ = this.actions$
        .ofType('PRODUCTS_LOAD_FOR_PMS')
        .switchMap(({ payload }) => getDatabase().then(db => ({ db, pmsKey: payload })))
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`pms-product/${x.pmsKey}`), { include_docs: true })))
        .map(allDocs => ({ type: 'PRODUCTS_LOAD_SUCCESS', payload: allDocs.rows.map(x => x.doc) }));
}
