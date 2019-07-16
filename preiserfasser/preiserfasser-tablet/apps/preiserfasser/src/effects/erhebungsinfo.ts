import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { map, mergeMap } from 'rxjs/operators';
import * as fromRoot from '../reducers';
import { getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class ErhebungsInfoEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadErheubngsInfoEffects$ = this.actions$.ofType('LOAD_ERHEBUNGSINFO').pipe(
        mergeMap(() => getDatabaseAsObservable()),
        mergeMap(db =>
            db
                .get('erhebungsmonat')
                .then((erhebungsmonatDoc: any) => ({ db, erhebungsmonat: erhebungsmonatDoc.monthAsString })),
        ),
        mergeMap(x =>
            x.db.get('erhebungsorgannummer').then((erhebungsorgannummerDoc: any) => ({
                erhebungsmonat: x.erhebungsmonat,
                erhebungsorgannummer: erhebungsorgannummerDoc.value,
            })),
        ),
        map(payload => ({ type: 'LOAD_ERHEBUNGSINFO_SUCCESS', payload })),
    );
}
