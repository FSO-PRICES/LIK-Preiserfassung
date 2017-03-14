import { Observable } from 'rxjs';

export function loggedIn<T>(isLoggedIn: Observable<any>, wrappable: Observable<T>, action: (actor: Observable<T>) => Observable<T>) {
    return action(wrappable.combineLatest(isLoggedIn.filter(loggedIn => !!loggedIn), (actor) => <T>actor))
        .catch(error => {
            if (!!error && error.status === 401 || error.status === 403) {
                return [{ type: 'SET_IS_LOGGED_IN', payload: false }];
            }
            throw (error);
        }).retry(1);
}
