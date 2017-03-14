import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import * as login from '../actions/login';
import { dbNames, getDatabase, loginToDatabase } from './pouchdb-utils';

@Injectable()
export class LoginEffects {
    currentLogin$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    checkIsLoggedIn$ = this.actions$
        .ofType('CHECK_IS_LOGGED_IN')
        .combineLatest(this.settings$.filter(settings => !!settings && !settings.isDefault).take(1))
        .switchMap(() => getDatabase(dbNames.users).then(db => db.allDocs()).then(resp => true).catch(reason => false))
        .map<login.Actions>(isLoggedIn => ({ type: 'SET_IS_LOGGED_IN', payload: isLoggedIn }));

    @Effect()
    login$ = this.actions$
        .ofType('LOGIN')
        .switchMap(({ payload }) => loginToDatabase(payload).then(() => true).catch(() => false))
        .map<login.Actions>(success => (success ? { type: 'LOGIN_SUCCESS' } : { type: 'LOGIN_FAIL' }));
}
