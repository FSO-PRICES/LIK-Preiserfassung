import { Models as P } from '@lik-shared';

import * as onoffline from '../actions/onoffline';

export type State = {
    currentClientId: string;
    status: P.WritePermissionStatus;
};

const initialState: State = {
    currentClientId: null,
    status: {
        clientId: null,
        updatedAt: null,
    },
};

export function reducer(state = initialState, action: onoffline.Action): State {
    switch (action.type) {
        case onoffline.LOAD_WRITE_PERMISSION_SUCCESS:
            return { ...state, status: action.payload };
        case onoffline.SET_CURRENT_CLIENT_ID:
            return { ...state, currentClientId: action.payload };

        default:
            return state;
    }
}

export const hasWritePermission = (state: State) =>
    !!state.status.clientId && state.status.clientId === state.currentClientId;
export const canToggleWritePermission = (state: State) =>
    state.status.clientId === null || state.status.clientId === state.currentClientId;
