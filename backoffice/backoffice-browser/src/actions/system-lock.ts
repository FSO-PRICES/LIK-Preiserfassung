import { Models as P } from 'lik-shared';

export const LOAD_SYSTEM_LOCK = 'LOAD_SYSTEM_LOCK';
export const LOAD_SYSTEM_LOCK_SUCCESS = 'LOAD_SYSTEM_LOCK_SUCCESS';
export const SET_SYSTEM_LOCK = 'SET_SYSTEM_LOCK';

export type Action =
    | { type: typeof LOAD_SYSTEM_LOCK }
    | { type: typeof LOAD_SYSTEM_LOCK_SUCCESS, payload: P.SystemLockStatus }
    | { type: typeof SET_SYSTEM_LOCK, payload: boolean };
