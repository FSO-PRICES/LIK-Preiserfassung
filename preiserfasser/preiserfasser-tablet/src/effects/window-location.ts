import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import * as docuri from 'docuri';

import * as P from '../common-models';

const preismeldungUri = docuri.route(P.Models.preismeldungUriRoute);

@Injectable()
export class WindowLocationEffects {
    constructor(private actions$: Actions) {
    }

    @Effect()
    selectPreismeldungNoFurtherAction$ = this.actions$
        .ofType('SELECT_PREISMELDUNG')
        .do(x => {
            // const product = <PreismeldungUri>preismeldungUri(x.payload);
            // window.history.replaceState(null, null, `#/price-entry/${product.pmsKey}?position-number=${product.positionNumber}&sequence-number=${product.sequenceNumber}`);
        })
        .mapTo({ type: 'SELECT_PREISMELDUNG_NO_FURTHER_ACTION', payload: null });
}
