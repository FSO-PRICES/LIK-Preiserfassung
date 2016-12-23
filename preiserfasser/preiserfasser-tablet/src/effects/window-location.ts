import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import * as docuri from 'docuri';

import { ProductUri, productUriRoute } from '../common-models';

const productUri = docuri.route(productUriRoute);

@Injectable()
export class WindowLocationEffects {
    constructor(private actions$: Actions) {
    }

    @Effect()
    selectProductNoFurtherAction$ = this.actions$
        .ofType('SELECT_PRODUCT')
        .do(x => {
            const product = <ProductUri>productUri(x.payload);
            // window.history.replaceState(null, null, `#/price-entry/${product.pmsKey}?position-number=${product.positionNumber}&sequence-number=${product.sequenceNumber}`);
        })
        .mapTo({});
}
