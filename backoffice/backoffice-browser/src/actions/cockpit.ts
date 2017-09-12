import { Models as P } from 'lik-shared';

export const LOAD_COCKPIT_DATA = 'LOAD_COCKPIT_DATA';
export const LOAD_COCKPIT_DATA_SUCCESS = 'LOAD_COCKPIT_DATA_SUCCESS';

export type Action =
    { type: typeof LOAD_COCKPIT_DATA } |
    { type: typeof LOAD_COCKPIT_DATA_SUCCESS; payload: { lastSyncedAt: { [username: string]: { value: string }[] }, preismeldungen: P.Preismeldung[], refPreismeldungen: P.PreismeldungReference[], preismeldestellen: P.Preismeldestelle[], preiszuweisungen: P.Preiszuweisung[], preiserheber: P.Erheber[] } };
