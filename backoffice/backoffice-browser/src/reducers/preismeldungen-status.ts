import * as preismeldungenStatus from '../actions/preismeldungen-status';

import { groupBy } from 'lodash';
import { Models as P } from 'lik-shared';

export interface State {
    statusMap: { [pmId: string]: P.PreismeldungStatus };
}

const initialState: State = {
    statusMap: null,
};

export function reducer(state = initialState, action: preismeldungenStatus.Action): State {
    switch (action.type) {
        case preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS_SUCCESS: {
            return {
                ...state,
                statusMap: action.payload,
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
