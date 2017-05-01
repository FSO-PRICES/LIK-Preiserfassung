import { Observable } from 'rxjs';

export function continueOnlyIfTrue<T>(checkingObservable$: Observable<boolean>) {
    return (observable: Observable<T>) => observable
        .switchMap(action => checkingObservable$
            .filter(check => check !== null && !!check)
            .take(1)
            .mapTo(action)
        );
}

export function continueEffectOnlyIfTrue(checkingObservable$: Observable<boolean>) {
    return continueOnlyIfTrue<SimpleAction>(checkingObservable$);
}

export interface Action<T> {
    type: string;
    payload: T;
}

export interface SimpleAction {
    type: string;
    payload: any;
}
