import { assign } from 'lodash';

import * as pdf from '../actions/pdf';

export interface State {
    createdPmsPdf: { message: string } | null;
}

const initialState: State = {
    createdPmsPdf: null
};

export function reducer(state = initialState, action: pdf.Action): State {
    switch (action.type) {
        case 'PDF_RESET_PMS':
            return assign({}, state, { createdPmsPdf: null });
        case 'PDF_CREATED_PMS':
            return assign({}, state, { createdPmsPdf: { message: action.payload } });

        default:
            return state;
    }
}

export const getCreatedPmsPdf = (state: State) => state.createdPmsPdf;
