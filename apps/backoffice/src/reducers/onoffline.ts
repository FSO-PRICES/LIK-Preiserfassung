import { Models as P } from '@lik-shared';

import * as onoffline from '../actions/onoffline';

export type State = P.OnOfflineStatus;

const initialState: P.OnOfflineStatus = {
    canConnectToDatabase: null,
    minVersion: null,
    isOffline: false,
    updatedAt: null,
};

export function reducer(state = initialState, action: onoffline.Action): State {
    switch (action.type) {
        case onoffline.CAN_CONNECT_TO_DATABASE:
            return { ...state, canConnectToDatabase: action.payload };

        case onoffline.LOAD_ONOFFLINE_SUCCESS:
            return { ...state, ...action.payload };

        case onoffline.RESET_MIN_VERSION:
            return { ...state, minVersion: initialState.minVersion };

        default:
            return state;
    }
}

export const getIsOffline = (state: State) => state.isOffline;
export const getMinVersion = (state: State) => state.minVersion;
export const getCanConnectToDatabase = (state: State) => state.canConnectToDatabase;
