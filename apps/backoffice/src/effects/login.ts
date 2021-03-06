/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
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
    checkIsLoggedIn$ = this.actions$.pipe(
        ofType('CHECK_IS_LOGGED_IN'),
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
    login$ = this.actions$.pipe(
        ofType('LOGIN'),
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
    logout$ = this.actions$.pipe(
        ofType('LOGOUT'),
        flatMap(() => logoutOfDatabase()),
        tap(() => resetCurrentLoggedInUser()),
        map(() => ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)),
    );
}
