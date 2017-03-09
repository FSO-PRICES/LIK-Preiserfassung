import * as P from '../common-models';
import { assign } from 'lodash';

export interface State {
    warenkorbFlat: P.Models.WarenkorbTreeItem[];
}

const initialState: State = {
    warenkorbFlat: []
};

type Actions =
    { type: 'LOAD_WARENKORB_SUCCESS', payload: P.Models.WarenkorbTreeItem[] };

export function reducer(state = initialState, action: Actions): State {
    switch (action.type) {
        case 'LOAD_WARENKORB_SUCCESS': {
            return assign({}, state, { warenkorbFlat: action.payload });
        }

        default:
            return state;
    }
}

export const getWarenkorbFlat = (state: State) => state.warenkorbFlat;
