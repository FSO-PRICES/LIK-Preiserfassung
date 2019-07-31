import { Observable, Observer, of } from 'rxjs';
import { concat, filter, map, switchMap, take } from 'rxjs/operators';

/** Emits "resetAction" first and after that, emits the results of "continuedObservable" */
export function resetAndContinueWith<T>(resetAction: SimpleAction, continuedObservable: Observable<T>) {
    return of(resetAction).pipe(concat(continuedObservable));
}

/** Wrap given "func" into a setTimeout and return the result as an observable */
export function doAsyncAsObservable<T>(func: () => T) {
    return Observable.create((observer: Observer<T>) => {
        setTimeout(() => {
            try {
                const result = func();

                observer.next(result);
                observer.complete();
            } catch (error) {
                observer.error(error);
            }
        });
    }) as Observable<T>;
}

export function continueOnlyIfTrue<T>(checkingObservable$: Observable<boolean>) {
    return (observable: Observable<T>) =>
        observable.pipe(
            switchMap(action =>
                checkingObservable$.pipe(
                    filter(check => check !== null && !!check),
                    take(1),
                    map(() => action),
                ),
            ),
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
