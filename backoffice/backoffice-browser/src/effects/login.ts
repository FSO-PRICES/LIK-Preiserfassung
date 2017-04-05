import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as login from '../actions/login';
import { dbNames, getDatabase, loginToDatabase } from './pouchdb-utils';
import { Action } from '../common/effects-extensions';
import { getCurrentLoggedInUser, setCurrentLoggedInUser, resetCurrentLoggedInUser } from '../common/login-extensions';

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
        .switchMap(() => getDatabase(dbNames.users)
            .then(db => db.allDocs())
            .then(resp => true)
            .catch(reason => {
                resetCurrentLoggedInUser();
                return false;
            })
        )
        .map(isLoggedIn => (!isLoggedIn ?
            { type: 'SET_IS_LOGGED_OUT' } as login.Action :
            { type: 'SET_IS_LOGGED_IN', payload: getCurrentLoggedInUser() } as login.Action)
        );

    @Effect()
    login$ = this.actions$
        .ofType('LOGIN')
        .switchMap<Action<P.Credentials>, P.User>(({ payload }) => loginToDatabase(payload).then(() => {
            setCurrentLoggedInUser(payload.username);
            return { username: payload.username };
        }).catch(() => null))
        .map(user => (user != null ? { type: 'LOGIN_SUCCESS', payload: user } as login.Action : { type: 'LOGIN_FAIL' } as login.Action));
}
