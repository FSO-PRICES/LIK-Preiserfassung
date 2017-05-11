import { PreismeldestelleStatisticsMap } from '../reducers/statistics';

export type Action =
    { type: 'PREISMELDUNG_STATISTICS_LOAD', payload: null } |
    { type: 'PREISMELDUNG_STATISTICS_LOAD_SUCCESS', payload: { preismeldestelleStatistics: PreismeldestelleStatisticsMap, monthAsString: string } } |
    { type: 'PREISMELDUNG_STATISTICS_RESET', payload: null };
