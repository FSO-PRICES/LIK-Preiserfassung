import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, flatMap, map } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as preiszuweisung from '../actions/preiszuweisung';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { dbNames, getDatabase } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class PreiszuweisungEffects {
    currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreiszuweisung$ = this.actions$.ofType('PREISZUWEISUNG_LOAD').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(() => getDatabase(dbNames.preiszuweisungen).then(db => ({ db }))),
        filter(({ db }) => db != null),
        flatMap(x =>
            x.db
                .allDocs(Object.assign({}, { include_docs: true }))
                .then(res => res.rows.map(y => y.doc) as P.Preiszuweisung[]),
        ),
        map(docs => ({ type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: docs } as preiszuweisung.Action)),
    );
}
