import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError, concatWith, filter, flatMap, map, mergeMap, take, tap } from 'rxjs/operators';

import * as login from '../actions/login';
import { getCurrentLoggedInUser, resetCurrentLoggedInUser, setCurrentLoggedInUser } from '../common/login-extensions';
import { checkConnectivity, dbNames, getDatabase, loginToDatabase, logoutOfDatabase } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class LoginEffects {
    currentLogin$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private translate: TranslateService,
    ) {}

    checkIsLoggedIn$ = createEffect(() =>
        this.actions$.pipe(
            ofType('CHECK_IS_LOGGED_IN'),
            mergeMap(() =>
                of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action).pipe(
                    concatWith(
                        this.settings$.pipe(
                            filter((settings) => !!settings),
                            take(1),
                            mergeMap((settings) =>
                                !!settings && !settings.isDefault
                                    ? checkConnectivity(settings.serverConnection.url)
                                    : of(false),
                            ),
                            tap((canConnect) => {
                                if (!canConnect) resetCurrentLoggedInUser();
                            }),

                            mergeMap((canConnect) => {
                                if (!canConnect) return of(null);

                                return getDatabase(dbNames.users)
                                    .then((db) => db.allDocs())
                                    .then(() => getCurrentLoggedInUser());
                            }),
                            catchError(() => {
                                resetCurrentLoggedInUser();
                                return of(null);
                            }),

                            map((loggedInUser) =>
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
        ),
    );

    // TODO Fix types
    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType('LOGIN'),
            flatMap((action: any) =>
                loginToDatabase(action.payload)
                    .then(() => {
                        setCurrentLoggedInUser(action.payload.username);
                        return { username: action.payload.username };
                    })
                    .then((user) =>
                        getDatabase(dbNames.users)
                            .then((db) => db.allDocs())
                            .then(() => ({ user, error: null }))
                            .catch(() => {
                                resetCurrentLoggedInUser();
                                return {
                                    user: null,
                                    error: this.translate.instant('label.login.unzureichende_berechtigung'),
                                };
                            }),
                    )
                    .catch(() => ({
                        user: null,
                        error: this.translate.instant('label.login.benutzer_oder_password_falsch'),
                    })),
            ),
            map(({ user, error }) =>
                !error
                    ? ({ type: 'LOGIN_SUCCESS', payload: user } as login.Action)
                    : ({ type: 'LOGIN_FAIL', payload: error } as login.Action),
            ),
        ),
    );

    logout$ = createEffect(() =>
        this.actions$.pipe(
            ofType('LOGOUT'),
            flatMap(() => logoutOfDatabase()),
            tap(() => resetCurrentLoggedInUser()),
            map(() => ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)),
        ),
    );
}
