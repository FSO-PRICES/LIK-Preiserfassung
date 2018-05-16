import * as preismeldungenStatus from '../actions/preismeldungen-status';

import { groupBy } from 'lodash';
import { Models as P } from 'lik-shared';

export interface State {
    statusMap: { [pmId: string]: P.PreismeldungStatus };
    statusAreInitializing: boolean;
}

const initialState: State = {
    statusMap: null,
    statusAreInitializing: false,
};

export function reducer(state = initialState, action: preismeldungenStatus.Action): State {
    switch (action.type) {
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING: {
            return {
                statusMap: null,
                statusAreInitializing: true,
            };
        }
        case preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMap: action.payload,
                statusAreInitializing: false,
            };
        }
        case preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMap: action.payload,
            };
        }
        default:
            return state;
    }
}

export const getPreismeldungenStatusMap = (state: State) => state.statusMap;
export const getAreStatusInitializing = (state: State) => state.statusAreInitializing;
