import { Models as P } from '@lik-shared';

import * as preismeldungenStatus from '../actions/preismeldungen-status';

export interface State {
    statusMap: { [pmId: string]: P.PreismeldungStatus };
    statusMapIsSyncing: boolean;
    statusMapMissingCount: number | null;
    statusMapUpdatedCount: number | null;
    statusAreInitializing: boolean;
}

const initialState: State = {
    statusMap: null,
    statusMapIsSyncing: false,
    statusMapMissingCount: null,
    statusMapUpdatedCount: null,
    statusAreInitializing: false,
};

export function reducer(state = initialState, action: preismeldungenStatus.Action): State {
    switch (action.type) {
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING: {
            return {
                statusMap: null,
                statusMapIsSyncing: true,
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
                statusMapIsSyncing: false,
                statusMapMissingCount: 0,
                statusMapUpdatedCount: action.payload.count,
                statusAreInitializing: false,
            };
        }
        case preismeldungenStatus.APPLY_PREISMELDUNGEN_STATUS: {
            return {
                ...state,
                statusMapIsSyncing: true,
            };
        }
        case preismeldungenStatus.SYNCED_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMapIsSyncing: false,
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
export const getAreStatusSyncing = (state: State) => state.statusMapIsSyncing;
