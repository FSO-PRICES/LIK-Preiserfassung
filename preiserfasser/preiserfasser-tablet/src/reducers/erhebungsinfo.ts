import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as erhebungsinfo from '../actions/erhebungsinfo';

export interface ErhebungsInfo {
    erhebungsmonat: string;
    erhebungsorgannummer: string;
};

export type State = ErhebungsInfo;

const initialState: State = {
    erhebungsmonat: null,
    erhebungsorgannummer: null
};

export function reducer(state = initialState, action: erhebungsinfo.Action): State {
    switch (action.type) {
        case 'LOAD_ERHEBUNGSINFO_SUCCESS': {
            return assign({}, state, action.payload);
        }

        default:
            return state;
    }
}

export const getErhebungsInfo = (state: State) => state;
