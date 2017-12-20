import { Models as P } from 'lik-shared';

export const LOAD_ONOFFLINE = 'LOAD_ONOFFLINE';
export const LOAD_ONOFFLINE_SUCCESS = 'LOAD_ONOFFLINE_SUCCESS';
export const TOGGLE_ONOFFLINE = 'TOGGLE_ONOFFLINE';

export type Action =
    | { type: typeof LOAD_ONOFFLINE }
    | { type: typeof LOAD_ONOFFLINE_SUCCESS; payload: P.OnOfflineStatus }
    | { type: typeof TOGGLE_ONOFFLINE };
