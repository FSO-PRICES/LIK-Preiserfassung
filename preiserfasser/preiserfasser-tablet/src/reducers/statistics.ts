import { assign, values, merge } from 'lodash';

import * as statistics from '../actions/statistics';

export type PreismeldungenStatistics = { [pmsNummer: number]: { totalCount: number, uploadedCount?: number, openSavedCount?: number, openUnsavedCount?: number } } & { total?: { totalCount: number, uploadedCount?: number, openSavedCount?: number, openUnsavedCount?: number } }

export interface State {
    preismeldungen: PreismeldungenStatistics;
};

const initialState: State = {
    preismeldungen: undefined
};

export function reducer(state = initialState, action: statistics.Action): State {
    switch (action.type) {
        case 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS': {
            const statistics = action.payload;
            const total = values(statistics).reduce(
                (total, bag) => {
                    total.totalCount = (total.totalCount || 0) + (bag.totalCount || 0);
                    total.uploadedCount = (total.uploadedCount || 0) + (bag.uploadedCount || 0);
                    total.openSavedCount = (total.openSavedCount || 0) + (bag.openSavedCount || 0);
                    total.openUnsavedCount = (total.openUnsavedCount || 0) + (bag.openUnsavedCount || 0);
                    return total;
                },
                {} as any
            );
            return assign({}, state, { preismeldungen: assign({}, action.payload, { total }) });
        }

        case 'PREISMELDUNG_STATISTICS_RESET': {
            return initialState;
        }

        default:
            return state;
    }
}

export const getPreismeldungenStatistics = (state: State) => state.preismeldungen;
