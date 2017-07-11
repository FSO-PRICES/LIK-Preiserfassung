import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import { getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class ErhebungsInfoEffects {
    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadErheubngsInfoEffects$ = this.actions$
        .ofType('LOAD_ERHEBUNGSINFO')
        .flatMap(() => getDatabaseAsObservable())
        .flatMap(db => db.get('erhebungsmonat').then(erhebungsmonatDoc => ({ db, erhebungsmonat: erhebungsmonatDoc.monthAsString })))
        .flatMap(x => x.db.get('erhebungsorgannummer').then(erhebungsorgannummerDoc => ({ erhebungsmonat: x.erhebungsmonat, erhebungsorgannummer: erhebungsorgannummerDoc.value })))
        .map(payload => ({ type: 'LOAD_ERHEBUNGSINFO_SUCCESS', payload }));
}
