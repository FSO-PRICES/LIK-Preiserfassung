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

import { SimpleChange } from '@angular/core';
import { Observable, ConnectableObservable, Observer } from 'rxjs';

export interface TypedSimpleChange<T> {
    previousValue: T;
    currentValue: T;
}

export class ReactiveComponent {
    private changesObserver: Observer<{ [key: string]: SimpleChange }>;
    private changes$: ConnectableObservable<{ [key: string]: SimpleChange }>;

    constructor() {
        this.changes$ = Observable.create((observer: Observer<{ [key: string]: SimpleChange }>) => this.changesObserver = observer).publishReplay(1);
        this.changes$.connect();
    }

    public observeProperty<T>(propertyName: string): Observable<TypedSimpleChange<T>> {
        return this.changes$
            .filter(changes => changes.hasOwnProperty(propertyName))
            .map(changes => changes[propertyName]);
    }

    observePropertyCurrentValue<T>(propertyName: string): Observable<T> {
        return this.observeProperty<T>(propertyName)
            .map(change => change.currentValue);
    }

    observeFunction<T>(functionName: string): Observable<T> {
        let observer: Observer<any>;
        const observable = Observable.create((obs: Observer<any>) => {
            observer = obs;
        });
        (<any>this)[functionName] = function (...args: any[]) {
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
