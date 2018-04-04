import { assign } from 'lodash';

import { Models as P, PmsFilter } from 'lik-shared';

import * as filterOptions from '../actions/filter-options';

export interface State {
    preismeldungList: {
        currentFilter: PmsFilter;
    };
}

const initialState: State = {
    preismeldungList: {
        currentFilter: {
            pmsNummers: [],
            preiserheberIds: [],
            epNummers: [],
            pmIdSearch: null,
        },
    },
};

export function reducer(state = initialState, action: filterOptions.Action): State {
    switch (action.type) {
        case 'UPDATE_PREISMELDUNG_LIST_FILTER':
            return { ...state, preismeldungList: { ...state.preismeldungList, currentFilter: action.payload } };

        default:
            return state;
    }
}

export const getCurrentPreismeldungListFilter = (state: State) => state.preismeldungList.currentFilter;
