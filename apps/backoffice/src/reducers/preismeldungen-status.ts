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

import { Models as P } from '@lik-shared';

import * as preismeldungenStatus from '../actions/preismeldungen-status';

export interface State {
    statusMap: { [pmId: string]: P.PreismeldungStatus };
    statusMapMissingCount: number | null;
    statusMapUpdatedCount: number | null;
    statusAreInitializing: boolean;
}

const initialState: State = {
    statusMap: null,
    statusMapMissingCount: null,
    statusMapUpdatedCount: null,
    statusAreInitializing: false,
};

export function reducer(state = initialState, action: preismeldungenStatus.Action): State {
    switch (action.type) {
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING: {
            return {
                statusMap: null,
                statusMapMissingCount: null,
                statusMapUpdatedCount: null,
                statusAreInitializing: true,
            };
        }
        case preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMap: action.payload.statusMap,
                statusMapUpdatedCount: action.payload.count,
            };
        }
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMap: action.payload,
            };
        }
        case preismeldungenStatus.GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_RESET: {
            return {
                ...state,
                statusMapMissingCount: null,
            };
        }
        case preismeldungenStatus.GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_SUCCESS: {
            return {
                ...state,
                statusMapMissingCount: action.payload,
            };
        }
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_INITIALIZED: {
            return {
                ...state,
                statusMap: action.payload.statusMap,
                statusMapMissingCount: 0,
                statusMapUpdatedCount: action.payload.count,
                statusAreInitializing: false,
            };
        }
        default:
            return state;
    }
}

export const getPreismeldungenStatusMap = (state: State) => state.statusMap;
export const getPreismeldungenStatusMapMissingCount = (state: State) => state.statusMapMissingCount;
export const getPreismeldungenStatusMapUpdatedCount = (state: State) => state.statusMapUpdatedCount;
export const getAreStatusInitializing = (state: State) => state.statusAreInitializing;
