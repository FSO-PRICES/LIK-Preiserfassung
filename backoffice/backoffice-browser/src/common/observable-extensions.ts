import { Observable as RxObservable, Subscription } from 'rxjs';

export interface FunctionWrapper {
    before?: () => void;
    after?: (result: Subscription) => void;
}

export class Observable<T> extends RxObservable<T> {
    collectibleSubscribe: (colleciton: Subscription[], observerOrNext?: ((value: T) => void), error?: (error: any) => void, complete?: () => void) => Subscription;
}

Observable.prototype.collectibleSubscribe = (function (original) {
    return function (collection: Subscription[], ...args) {

        const result = original.apply(this, args);
        collection.push(result);

        return result;
    }
})(Observable.prototype.collectibleSubscribe);
