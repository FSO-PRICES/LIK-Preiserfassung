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

import * as time from '../actions/time';
import { assign } from 'lodash';
import { startOfDay, differenceInMilliseconds, addMilliseconds } from 'date-fns';

export interface State {
    currentTime: Date;
    mockDate: Date;
    erhebungsMonat: Date;
}

const initialState: State = {
    currentTime: new Date(),
    mockDate: null,
    // mockDate: new Date(2017, 1, 10),
    erhebungsMonat: null
};

export function reducer(state = initialState, action: time.Actions): State {
    switch (action.type) {
        case 'TIME_SET': {
            const diff = !state.mockDate ? 0 : differenceInMilliseconds(state.mockDate, startOfDay(action.payload));
            return assign({}, state, { currentTime: addMilliseconds(action.payload, diff) });
        }

        default:
            return state;
    }
}

export const getCurrentTime = (state: State) => state.currentTime;
