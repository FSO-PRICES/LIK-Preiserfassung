import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import * as login from '../actions/login';
import { dbNames, getDatabase, loginToDatabase, checkServerConnection, logout } from '../common/pouchdb-utils';
import { getCurrentLoggedInUser, setCurrentLoggedInUser, resetCurrentLoggedInUser } from '../common/login-extensions';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class LoginEffects {
    currentLogin$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    checkIsLoggedIn$ = this.actions$.ofType('CHECK_IS_LOGGED_IN').flatMap(() =>
        Observable.of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action).concat(
            this.settings$
                .filter(settings => !!settings)
                .take(1)
                .flatMap(settings => {
                    const loggedInUser = getCurrentLoggedInUser();
                    if (!!settings && !settings.isDefault) {
                        return checkServerConnection()
                            .flatMap(() =>
                                getDatabase(dbNames.users)
                                    .then(db => db.allDocs())
                                    .then(resp => loggedInUser)
                            )
                            .catch(() => {
                                resetCurrentLoggedInUser();
                                return Observable.of(null);
                            });
                    }
                    return Observable.of(null);
                })
                .map(
                    loggedInUser =>
                        !loggedInUser
                            ? ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)
                            : ({
                                  type: 'SET_IS_LOGGED_IN',
                                  payload: loggedInUser,
                              } as login.Action)
                )
        )
    );

    @Effect()
    login$ = this.actions$
        .ofType('LOGIN')
        .flatMap(({ payload }) =>
            loginToDatabase(payload)
                .then(() => {
                    setCurrentLoggedInUser(payload.username);
                    return { username: payload.username };
                })
                .then(user =>
                    getDatabase(dbNames.users)
                        .then(db => db.allDocs())
                        .then(() => ({ user, error: null }))
                        .catch(reason => {
                            resetCurrentLoggedInUser();
                            return { user: null, error: 'Unzureichende Berechtigung.' };
                        })
                )
                .catch(() => ({ user: null, error: 'Benutzername oder Password stimmen nicht überein.' }))
        )
        .map(
            ({ user, error }) =>
                !error
                    ? ({ type: 'LOGIN_SUCCESS', payload: user } as login.Action)
                    : ({ type: 'LOGIN_FAIL', payload: error } as login.Action)
        );

    @Effect()
    logout$ = this.actions$
        .ofType('LOGOUT')
        .flatMap(() => logout())
        .map(() => ({ type: 'SET_IS_LOGGED_OUT' } as login.Action));
}
