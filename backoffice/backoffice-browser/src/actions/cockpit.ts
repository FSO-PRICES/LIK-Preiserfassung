import { Models as P } from 'lik-shared';
import { CockpitPreiserheberSummary } from '../common-models';

export const LOAD_COCKPIT_DATA = 'LOAD_COCKPIT_DATA';
export const LOAD_COCKPIT_DATA_EXECUTING = 'LOAD_COCKPIT_DATA_EXECUTING';
export const LOAD_COCKPIT_DATA_SUCCESS = 'LOAD_COCKPIT_DATA_SUCCESS';
export const COCKPIT_PREISERHEBER_SELECTED = 'COCKPIT_PREISERHEBER_SELECTED';

export type Action =
    | { type: typeof LOAD_COCKPIT_DATA }
    | { type: typeof LOAD_COCKPIT_DATA_EXECUTING }
    | {
          type: typeof LOAD_COCKPIT_DATA_SUCCESS;
          payload: {
              lastSyncedAt: { [username: string]: { value: string }[] };
              preismeldungen: P.Preismeldung[];
              refPreismeldungen: P.PreismeldungReference[];
              preismeldestellen: P.Preismeldestelle[];
              preiszuweisungen: P.Preiszuweisung[];
              preiserheber: P.Erheber[];
          };
      }
    | { type: typeof COCKPIT_PREISERHEBER_SELECTED; payload: CockpitPreiserheberSummary };
