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

import { Models as P, PmsFilter } from '@lik-shared';

import * as filterOptions from '../actions/filter-options';

export interface State {
    preismeldungList: {
        currentFilter: PmsFilter;
    };
}

const initialState: State = {
    preismeldungList: {
        currentFilter: {
            pmsNummers: [],
            preiserheberIds: [],
            epNummers: [],
            pmIdSearch: null,
            statusFilter: null,
        },
    },
};

export function reducer(state = initialState, action: filterOptions.Action): State {
    switch (action.type) {
        case 'UPDATE_PREISMELDUNG_LIST_FILTER':
            return { ...state, preismeldungList: { ...state.preismeldungList, currentFilter: action.payload } };

        default:
            return state;
    }
}

export const getCurrentPreismeldungListFilter = (state: State) => state.preismeldungList.currentFilter;
