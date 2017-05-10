import { assign, values } from 'lodash';

import * as statistics from '../actions/statistics';

export interface PreismeldestelleStatistics {
    totalCount: number;
    uploadedCount: number;
    openSavedCount: number;
    openUnsavedCount: number;
}

export type PreismeldestelleStatisticsMap = { [pmsNummer: string]: PreismeldestelleStatistics } & { total?: PreismeldestelleStatistics };

export interface State {
    pmsStatistics: PreismeldestelleStatisticsMap;
};

const initialState: State = {
    pmsStatistics: undefined
};

export function reducer(state = initialState, action: statistics.Action): State {
    switch (action.type) {
        case 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS': {
            const statistics = action.payload;
            const total = values(statistics).reduce(
                (agg, pmsStatistics) => ({
                    totalCount: agg.totalCount + pmsStatistics.totalCount,
                    uploadedCount: agg.uploadedCount + pmsStatistics.uploadedCount,
                    openSavedCount: agg.openSavedCount + pmsStatistics.openSavedCount,
                    openUnsavedCount: agg.openUnsavedCount + pmsStatistics.openUnsavedCount,
                }),
                { totalCount: 0, uploadedCount: 0, openSavedCount: 0, openUnsavedCount: 0 }
            );
            return assign({}, state, { pmsStatistics: assign({}, action.payload, { total }) });
        }

        case 'PREISMELDUNG_STATISTICS_RESET': {
            return initialState;
        }

        default:
            return state;
    }
}

export const getPreismeldungenStatistics = (state: State) => state.pmsStatistics;
