import * as controllingActions from '../actions/controlling';
import { Models as P } from 'lik-shared';
import { assign } from 'lodash';

export interface State {
    stichtagPreismeldungenUpdated: P.Preismeldung[];
}

const initialState: State = {
    stichtagPreismeldungenUpdated: []
};

export function reducer(state = initialState, action: controllingActions.Action): State {
    switch (action.type) {
        case 'UPDATE_STICHTAGE_SUCCESS':
            return assign({}, state, { stichtagPreismeldungenUpdated: action.payload });

        default:
            return state;
    }
}

export const getStichtagPreismeldungenUpdated = (state: State) => state.stichtagPreismeldungenUpdated;
