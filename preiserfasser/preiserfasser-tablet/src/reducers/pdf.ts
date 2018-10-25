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

import { assign } from 'lodash';

import * as pdf from '../actions/pdf';

export interface State {
    createdPmsPdf: { message?: string; error?: any } | null;
}

const initialState: State = {
    createdPmsPdf: null,
};

export function reducer(state = initialState, action: pdf.Action): State {
    switch (action.type) {
        case 'PDF_RESET_PMS':
            return assign({}, state, { createdPmsPdf: null });
        case 'PDF_CREATED_PMS':
            return assign({}, state, { createdPmsPdf: { message: action.payload } });
        case 'PDF_CREATION_FAILED':
            return assign({}, state, { createdPmsPdf: { error: action.payload } });

        default:
            return state;
    }
}

export const getCreatedPmsPdf = (state: State) => state.createdPmsPdf;
