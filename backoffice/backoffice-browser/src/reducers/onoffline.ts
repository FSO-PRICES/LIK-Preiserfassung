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

import { Models as P } from 'lik-shared';

import * as onoffline from '../actions/onoffline';

export type State = P.OnOfflineStatus;

const initialState: P.OnOfflineStatus = {
    isOffline: false,
    updatedAt: null,
};

export function reducer(state = initialState, action: onoffline.Action): State {
    switch (action.type) {
        case onoffline.LOAD_ONOFFLINE_SUCCESS:
            return action.payload;

        default:
            return state;
    }
}

export const getIsOffline = (state: State) => state.isOffline;
