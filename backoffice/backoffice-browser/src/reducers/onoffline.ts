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
