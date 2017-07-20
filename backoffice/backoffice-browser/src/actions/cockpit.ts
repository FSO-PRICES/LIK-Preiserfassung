import { Models as P } from 'lik-shared';

export type Action =
    { type: 'LOAD_COCKPIT_DATA' } |
    { type: 'LOAD_COCKPIT_DATA_SUCCESS'; payload: { lastSyncedAt: { [username: string]: { value: string }[] }, preismeldungen: P.Preismeldung[], refPreismeldungen: P.PreismeldungReference[], preismeldestellen: P.Preismeldestelle[], preiszuweisungen: P.Preiszuweisung[], preiserheber: P.Erheber[] } };
