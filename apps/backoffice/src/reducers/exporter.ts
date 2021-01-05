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

import * as exporter from '../actions/exporter';

export interface State {
    exportedPreismeldungen: number;
    exportedPreismeldestellen: number;
    exportedPreiserheber: number;

    preismeldungenError: { validations: { error: string }[] };
    preismeldestellenError: { validations: { error: string }[] };
    preiserheberError: { validations: { error: string }[] };
}

const initialState: State = {
    exportedPreismeldungen: null,
    exportedPreismeldestellen: null,
    exportedPreiserheber: null,

    preismeldungenError: null,
    preismeldestellenError: null,
    preiserheberError: null,
};

export function reducer(state = initialState, action: exporter.Action): State {
    switch (action.type) {
        case 'EXPORT_PREISMELDUNGEN_RESET': {
            return { ...state, exportedPreismeldungen: null, preismeldungenError: null };
        }

        case 'EXPORT_PREISMELDUNGEN_SUCCESS': {
            const { payload } = action;
            return { ...state, exportedPreismeldungen: payload, preismeldungenError: null };
        }

        case 'EXPORT_PREISMELDUNGEN_FAILURE': {
            return { ...state, exportedPreismeldungen: null, preismeldungenError: action.payload };
        }

        case 'EXPORT_PREISMELDESTELLEN_RESET': {
            return { ...state, exportedPreismeldestellen: null, preismeldestellenError: null };
        }

        case 'EXPORT_PREISMELDESTELLEN_SUCCESS': {
            const { payload } = action;
            return { ...state, exportedPreismeldestellen: payload, preismeldestellenError: null };
        }

        case 'EXPORT_PREISMELDESTELLEN_FAILURE': {
            return { ...state, exportedPreismeldestellen: null, preismeldestellenError: action.payload };
        }

        case 'EXPORT_PREISERHEBER_RESET': {
            return { ...state, exportedPreiserheber: null, preiserheberError: null };
        }

        case 'EXPORT_PREISERHEBER_SUCCESS': {
            const { payload } = action;
            return { ...state, exportedPreiserheber: payload, preiserheberError: null };
        }

        case 'EXPORT_PREISERHEBER_FAILURE': {
            return { ...state, exportedPreiserheber: null, preiserheberError: action.payload };
        }

        default:
            return state;
    }
}

export const getExportedPreismeldungen = (state: State) => state.exportedPreismeldungen;
export const getExportedPreismeldestellen = (state: State) => state.exportedPreismeldestellen;
export const getExportedPreiserheber = (state: State) => state.exportedPreiserheber;
