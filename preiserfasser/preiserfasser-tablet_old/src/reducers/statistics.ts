import { assign, values } from 'lodash';
import { parse } from 'date-fns';

import * as statistics from '../actions/statistics';

export interface PreismeldestelleStatistics {
    downloadedCount: number;
    totalCount: number;
    uploadedCount: number;
    openSavedCount: number;
    openUnsavedCount: number;
}

export type PreismeldestelleStatisticsMap = { [pmsNummer: string]: PreismeldestelleStatistics } & { total?: PreismeldestelleStatistics };

export interface State {
    pmsStatistics: PreismeldestelleStatisticsMap;
    erhebungsmonat: string;
};

const initialState: State = {
    pmsStatistics: undefined,
    erhebungsmonat: undefined
};

export function reducer(state = initialState, action: statistics.Action): State {
    switch (action.type) {
        case 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS': {
            const { preismeldestelleStatistics } = action.payload;
            const total = values(preismeldestelleStatistics).reduce(
                (agg, pmsStatistics) => ({
                    downloadedCount: agg.downloadedCount + pmsStatistics.downloadedCount,
                    totalCount: agg.totalCount + pmsStatistics.totalCount,
                    uploadedCount: agg.uploadedCount + pmsStatistics.uploadedCount,
                    openSavedCount: agg.openSavedCount + pmsStatistics.openSavedCount,
                    openUnsavedCount: agg.openUnsavedCount + pmsStatistics.openUnsavedCount,
                }),
                { downloadedCount: 0, totalCount: 0, uploadedCount: 0, openSavedCount: 0, openUnsavedCount: 0 }
            );
            return assign({}, state, { pmsStatistics: assign({}, action.payload.preismeldestelleStatistics, { total }), erhebungsmonat: convertPefDateToDateFnsString(action.payload.monthAsString) });
        }

        case 'PREISMELDUNG_STATISTICS_RESET': {
            return initialState;
        }

        default:
            return state;
    }
}

const convertPefDateToDateFnsString = s => {
    const parts = s.split('.');
    return parse(`${parts[2]}-${parts[1]}-${parts[0]}`);
}

export const getPreismeldungenStatistics = (state: State) => state.pmsStatistics;
export const getErhebungsmonat = (state: State) => state.erhebungsmonat;
