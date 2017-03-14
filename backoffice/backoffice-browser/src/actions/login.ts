import { Models as P } from 'lik-shared';

export type Actions =
    { type: 'LOGIN', payload: P.Credentials } |
    { type: 'LOGIN_SUCCESS' } |
    { type: 'LOGIN_FAIL' } |
    { type: 'CHECK_IS_LOGGED_IN' } |
    { type: 'SET_IS_LOGGED_IN', payload: boolean };
