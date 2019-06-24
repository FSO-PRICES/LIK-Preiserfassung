import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of, from } from 'rxjs';
import { flatMap, concat, map, combineLatest, take, catchError } from 'rxjs/operators';

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
    checkIsLoggedIn$ = this.actions$.ofType('CHECK_IS_LOGGED_IN').pipe(
        flatMap(() =>
            of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action).pipe(
                concat(
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
        ),
    );

    @Effect()
    login$ = this.actions$.ofType('LOGIN').pipe(
        flatMap((
            action: any, // TODO Fix typing
        ) =>
            of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action).pipe(
                concat(
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
