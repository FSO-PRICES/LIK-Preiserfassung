import { Observable } from 'rxjs';

import * as login from '../actions/login';

export function loggedIn<T>(isLoggedIn: Observable<any>, wrappable: Observable<T>, action: (actor: Observable<T>) => Observable<T>) {
    return action(wrappable.combineLatest(isLoggedIn.filter(loggedIn => !!loggedIn), (actor) => <T>actor))
        .catch(error => {
            if (!!error && (error.status === 401 || error.status === 403)) {
                return [{ type: 'SET_IS_LOGGED_OUT' } as login.Action];
            }
            throw (error);
        }).retry(1);
}

export interface Action<T> {
    type: string;
    payload: T;
}
