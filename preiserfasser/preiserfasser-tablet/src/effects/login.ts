import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as login from '../actions/login';
import { getLoggedInUser, loginIntoDatabase, getDatabaseAsObservable } from './pouchdb-utils';

@Injectable()
export class LoginEffects {
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    checkIsLoggedIn$ = this.actions$.ofType('CHECK_IS_LOGGED_IN')
        .flatMap(() =>
            Observable.of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action)
                .concat(this.getSettingsAndUsername()
                    .flatMap(({ settings, username }) =>
                        getLoggedInUser(settings.serverConnection.url, username)
                            .map(loggedInUser => !loggedInUser ?
                                { type: 'SET_IS_LOGGED_OUT' } as login.Action :
                                { type: 'SET_IS_LOGGED_IN', payload: loggedInUser } as login.Action
                            )
                    )
                    .catch(error => Observable.of({ type: 'SET_IS_LOGGED_OUT', payload: error.message } as login.Action))
                )
        );

    @Effect()
    login$ = this.actions$.ofType('LOGIN')
        .flatMap(({ payload }) =>
            Observable.of({ type: 'RESET_IS_LOGGED_IN_STATE' } as login.Action)
                .concat(loginIntoDatabase(payload)
                    .map(() => ({ user: { username: payload.username }, error: null }))
                    .catch(() => Observable.of(({ user: null, error: 'Benutzername oder Password stimmen nicht überein.' })))
                    .map(({ user, error }) => (!error ?
                        { type: 'LOGIN_SUCCESS', payload: user } as login.Action :
                        { type: 'LOGIN_FAIL', payload: error } as login.Action)
                    )
                )
        );

    private getSettingsAndUsername() {
        return getDatabaseAsObservable()
            .flatMap(db => Observable.fromPromise(db.get('preiserheber').then(pe => pe.username)))
            .combineLatest(this.store.select(fromRoot.getSettings).take(1), (username, settings) => ({ username, settings }));
    }
}
