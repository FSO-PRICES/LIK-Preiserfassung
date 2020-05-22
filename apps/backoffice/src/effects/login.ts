import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, concat, filter, flatMap, map, take, tap } from 'rxjs/operators';

import * as login from '../actions/login';
import { getCurrentLoggedInUser, resetCurrentLoggedInUser, setCurrentLoggedInUser } from '../common/login-extensions';
import {
    checkServerConnection,
    dbNames,
    getDatabase,
    loginToDatabase,
    logoutOfDatabase,
} from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class LoginEffects {
    currentLogin$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    checkIsLoggedIn$ = this.actions$.ofType('CHECK_IS_LOGGED_IN').pipe(
        flatMap(() =>
            of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action).pipe(
                concat(
                    this.settings$.pipe(
                        filter(settings => !!settings),
                        take(1),
                        flatMap(settings => {
                            const loggedInUser = getCurrentLoggedInUser();
                            if (!!settings && !settings.isDefault) {
                                return checkServerConnection().pipe(
                                    flatMap(() =>
                                        getDatabase(dbNames.users)
                                            .then(db => db.allDocs())
                                            .then(() => loggedInUser),
                                    ),
                                    catchError(() => {
                                        resetCurrentLoggedInUser();
                                        return of(null);
                                    }),
                                );
                            }
                            return of(null);
                        }),
                        map(loggedInUser =>
                            !loggedInUser
                                ? ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)
                                : ({
                                      type: 'SET_IS_LOGGED_IN',
                                      payload: loggedInUser,
                                  } as login.Action),
                        ),
                    ),
                ),
            ),
        ),
    );

    @Effect()
    // TODO Fix types
    login$ = this.actions$.ofType('LOGIN').pipe(
        flatMap((action: any) =>
            loginToDatabase(action.payload)
                .then(() => {
                    setCurrentLoggedInUser(action.payload.username);
                    return { username: action.payload.username };
                })
                .then(user =>
                    getDatabase(dbNames.users)
                        .then(db => db.allDocs())
                        .then(() => ({ user, error: null }))
                        .catch(() => {
                            resetCurrentLoggedInUser();
                            return { user: null, error: 'Unzureichende Berechtigung.' };
                        }),
                )
                .catch(() => ({ user: null, error: 'Benutzername oder Password stimmen nicht überein.' })),
        ),
        map(({ user, error }) =>
            !error
                ? ({ type: 'LOGIN_SUCCESS', payload: user } as login.Action)
                : ({ type: 'LOGIN_FAIL', payload: error } as login.Action),
        ),
    );

    @Effect()
    logout$ = this.actions$.ofType('LOGOUT').pipe(
        flatMap(() => logoutOfDatabase()),
        tap(() => resetCurrentLoggedInUser()),
        map(() => ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)),
    );
}
