import { Models as P } from '@lik-shared';

export const CHECK_CONNECTIVITY_TO_DATABASE = 'CHECK_CONNECTIVITY_TO_DATABASE';
export const CAN_CONNECT_TO_DATABASE = 'CAN_CONNECT_TO_DATABASE';
export const LOAD_ONOFFLINE = 'LOAD_ONOFFLINE';
export const LOAD_ONOFFLINE_SUCCESS = 'LOAD_ONOFFLINE_SUCCESS';
export const LOAD_WRITE_PERMISSION = 'LOAD_WRITE_PERMISSION';
export const LOAD_WRITE_PERMISSION_SUCCESS = 'LOAD_WRITE_PERMISSION_SUCCESS';
export const RESET_MIN_VERSION = 'RESET_MIN_VERSION';
export const SAVE_MIN_VERSION = 'SAVE_MIN_VERSION';
export const TOGGLE_ONOFFLINE = 'TOGGLE_ONOFFLINE';
export const TOGGLE_WRITE_PERMISSION = 'TOGGLE_WRITE_PERMISSION';
export const SET_CURRENT_CLIENT_ID = 'SET_CURRENT_CLIENT_ID';

export type Action =
    | { type: typeof CHECK_CONNECTIVITY_TO_DATABASE }
    | { type: typeof CAN_CONNECT_TO_DATABASE; payload: boolean }
    | { type: typeof LOAD_ONOFFLINE }
    | { type: typeof LOAD_ONOFFLINE_SUCCESS; payload: P.OnOfflineStatus }
    | { type: typeof LOAD_WRITE_PERMISSION }
    | { type: typeof LOAD_WRITE_PERMISSION_SUCCESS; payload: P.WritePermissionStatus }
    | { type: typeof RESET_MIN_VERSION }
    | { type: typeof SAVE_MIN_VERSION; payload: string }
    | { type: typeof TOGGLE_ONOFFLINE }
    | { type: typeof TOGGLE_WRITE_PERMISSION; payload: { force?: boolean } }
    | { type: typeof SET_CURRENT_CLIENT_ID; payload: string };
