import { SimpleChange } from '@angular/core';
import { ConnectableObservable, Observable, Observer } from 'rxjs';
import { filter, map, publishReplay } from 'rxjs/operators';

export interface TypedSimpleChange<T> {
    previousValue: T;
    currentValue: T;
}

export class ReactiveComponent {
    private changesObserver: Observer<{ [key: string]: SimpleChange }>;
    private changes$: ConnectableObservable<{ [key: string]: SimpleChange }>;

    constructor() {
        this.changes$ = Observable.create(
            (observer: Observer<{ [key: string]: SimpleChange }>) => (this.changesObserver = observer),
        ).pipe(publishReplay(1));
        this.changes$.connect();
    }

    public observeProperty<T>(propertyName: string): Observable<TypedSimpleChange<T>> {
        return this.changes$.pipe(
            filter(changes => changes.hasOwnProperty(propertyName)),
            map(changes => changes[propertyName]),
        );
    }

    observePropertyCurrentValue<T>(propertyName: string): Observable<T> {
        return this.observeProperty<T>(propertyName).pipe(map(change => change.currentValue));
    }

    observeFunction<T>(functionName: string): Observable<T> {
        let observer: Observer<any>;
        const observable = Observable.create((obs: Observer<any>) => {
            observer = obs;
        });
        (<any>this)[functionName] = function(...args: any[]) {
            if (observer) {
                if (args.length === 1) {
                    observer.next(args[0]);
                } else {
                    observer.next(args);
                }
            }
        };
        return observable;
    }

    baseNgOnChanges(changes: { [key: string]: SimpleChange }) {
        this.changesObserver.next(changes);
    }
}