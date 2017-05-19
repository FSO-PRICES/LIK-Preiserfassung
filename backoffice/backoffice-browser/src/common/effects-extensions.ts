import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

/** Emits "resetAction" first and after that, emits the results of "continuedObservable" */
export function resetAndContinueWith<T>(resetAction: SimpleAction, continuedObservable: Observable<Action<T>>) {
    return Observable.of(resetAction)
        .concat(continuedObservable);
}

/** Wrap given "func" into a setTimeout and return the result as an observable */
export function doAsyncAsObservable<T>(func: () => T) {
    return Observable.create((observer: Observer<T>) => {
        setTimeout(() => {
            const result = func();

            observer.next(result);
            observer.complete();
        });
    }) as Observable<T>;
}

export function continueOnlyIfTrue<T>(checkingObservable$: Observable<boolean>) {
    return (observable: Observable<T>) => observable
        .switchMap(action => checkingObservable$
            .filter(check => check !== null && !!check)
            .take(1)
            .map(() => action)
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
    payload?: any;
}
