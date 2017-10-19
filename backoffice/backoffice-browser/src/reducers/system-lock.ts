import { Models as P } from 'lik-shared';

import * as systemLock from '../actions/system-lock';

export type State = P.SystemLockStatus;

const initialState: P.SystemLockStatus = {
    isLocked: false,
    updatedAt: null
};

export function reducer(state = initialState, action: systemLock.Action): State {
    switch (action.type) {
        case systemLock.LOAD_SYSTEM_LOCK_SUCCESS:
            return action.payload;

        default:
            return state;
    }
}
