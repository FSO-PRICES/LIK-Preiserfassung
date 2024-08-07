/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { Action, MetaReducer } from '@ngrx/store';

const formatTime = (time: Date) =>
    new Date(time.getTime() - time.getTimezoneOffset() * 60000).toISOString().substring(11, 23);

const initActions = ['@ngrx/store/init', '@ngrx/effects/init'];

export function storeLogger<S>(dontLogActionTypes: string[]): MetaReducer<S, Action> {
    let prevState: S | undefined;
    const _dontLogActionTypes = [...initActions, ...dontLogActionTypes];
    return (reducer) => (state, action) => {
        const started = performance.now();
        const startedTime = new Date();

        const nextState = reducer(state, action);

        const took = performance.now() - started;

        if (!_dontLogActionTypes.includes(action.type)) {
            console.group(`action ${formatTime(startedTime)} ${action.type} (in ${took.toFixed(2)} ms)`);
            console.log(`%c prev state`, `color: #9E9E9E; font-weight: bold`, prevState);
            console.log(`%c action`, `color: #03A9F4; font-weight: bold`, action);
            console.log(`%c next state`, `color: #4CAF50; font-weight: bold`, nextState);
            console.groupEnd();
        }

        prevState = nextState;

        return nextState;
    };
}
