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

import { Actions } from '../actions/error';

export interface State {
    [type: string]: string;
}

const initialState: State = {};

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_DATABASE_LAST_SYNCED_FAILURE':
        case 'CHECK_DATABASE_FAILURE':
        case 'DELETE_DATABASE_FAILURE':
        case 'LOAD_ERHEBUNGSINFO_FAILURE':
        case 'SAVE_PREISERHEBER_FAILURE':
        case 'PREISMELDESTELLEN_LOAD_FAILURE':
        case 'SAVE_PREISMELDESTELLE_FAILURE':
        case 'PREISMELDUNGEN_LOAD_FAILURE':
        case 'SAVE_PREISMELDUNG_PRICE_FAILURE':
        case 'SAVE_NEW_PREISMELDUNG_PRICE_FAILURE':
        case 'SAVE_PREISMELDUNG_MESSAGES_FAILURE':
        case 'SAVE_PREISMELDUNG_ATTRIBUTES_FAILURE':
        case 'RESET_PREISMELDUNG_FAILURE':
        case 'DELETE_PREISMELDUNG_FAILURE':
        case 'PREISMELDUNGEN_SORT_SAVE_FAILURE':
        case 'PREISMELDUNG_STATISTICS_LOAD_FAILURE':
            state[action.type] = action.payload;
            console.warn('An unhandled error occured:');
            console.error(action.payload);
            return state;
        default:
            return state;
    }
}

export const getIsDesktop = (state: State) => state.isDesktop;
