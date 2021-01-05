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
import { TranslateService } from '@ngx-translate/core';
import { concat, from, of } from 'rxjs';
import { catchError, combineLatest, flatMap, map, take } from 'rxjs/operators';

import * as login from '../actions/login';
import * as fromRoot from '../reducers';
import { getDatabaseAsObservable, getLoggedInUser, loginIntoDatabase } from './pouchdb-utils';

@Injectable()
export class LoginEffects {
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private translate: TranslateService,
    ) {}

    @Effect()
    checkIsLoggedIn$ = this.actions$.pipe(
        ofType('CHECK_IS_LOGGED_IN'),
        flatMap(() =>
            concat(
                [{ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action],
                this.getSettingsAndUsername().pipe(
                    flatMap(({ settings, username }) =>
                        getLoggedInUser(settings.serverConnection.url, username).pipe(
                            map(loggedInUser =>
                                !loggedInUser
                                    ? ({ type: 'SET_IS_LOGGED_OUT' } as login.Action)
                                    : ({ type: 'SET_IS_LOGGED_IN', payload: loggedInUser } as login.Action),
                            ),
                        ),
                    ),
                    catchError(error => of({ type: 'SET_IS_LOGGED_OUT' } as login.Action)),
                ),
            ),
        ),
    );

    @Effect()
    login$ = this.actions$.pipe(
        ofType('LOGIN'),
        flatMap((
            action: any, // TODO Fix typing
        ) =>
            concat(
                [{ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action],
                loginIntoDatabase(action.payload).pipe(
                    map(() => ({ user: { username: action.payload.username }, error: null })),
                    catchError(() =>
                        of({ user: null, error: this.translate.instant('error_login-wrong-credentials') }),
                    ),
                    map(({ user, error }) =>
                        !error
                            ? ({ type: 'LOGIN_SUCCESS', payload: user } as login.Action)
                            : ({ type: 'LOGIN_FAIL', payload: error } as login.Action),
                    ),
                ),
            ),
        ),
    );

    private getSettingsAndUsername() {
        return getDatabaseAsObservable().pipe(
            flatMap(db => from(db.get('preiserheber').then((pe: any) => pe.username))),
            combineLatest(this.store.select(fromRoot.getSettings).pipe(take(1)), (username, settings) => ({
                username,
                settings,
            })),
        );
    }
}
