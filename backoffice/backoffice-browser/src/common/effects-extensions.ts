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

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

/** Emits "resetAction" first and after that, emits the results of "continuedObservable" */
export function resetAndContinueWith<T>(resetAction: SimpleAction, continuedObservable: Observable<T>) {
    return Observable.of(resetAction)
        .concat(continuedObservable);
}

/** Wrap given "func" into a setTimeout and return the result as an observable */
export function doAsyncAsObservable<T>(func: () => T) {
    return Observable.create((observer: Observer<T>) => {
        setTimeout(() => {
            try {
                const result = func();

                observer.next(result);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
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
