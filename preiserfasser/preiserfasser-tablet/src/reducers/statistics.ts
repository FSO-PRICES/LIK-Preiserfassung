/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
