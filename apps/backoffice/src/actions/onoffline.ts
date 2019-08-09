import { Models as P } from '@lik-shared';

export const CHECK_CONNECTIVITY_TO_DATABASE = 'CHECK_CONNECTIVITY_TO_DATABASE';
export const CAN_CONNECT_TO_DATABASE = 'CAN_CONNECT_TO_DATABASE';
export const LOAD_ONOFFLINE = 'LOAD_ONOFFLINE';
export const LOAD_ONOFFLINE_SUCCESS = 'LOAD_ONOFFLINE_SUCCESS';
export const TOGGLE_ONOFFLINE = 'TOGGLE_ONOFFLINE';

export type Action =
    | { type: typeof CHECK_CONNECTIVITY_TO_DATABASE }
    | { type: typeof CAN_CONNECT_TO_DATABASE; payload: boolean }
    | { type: typeof LOAD_ONOFFLINE }
    | { type: typeof LOAD_ONOFFLINE_SUCCESS; payload: P.OnOfflineStatus }
    | { type: typeof TOGGLE_ONOFFLINE };