import { Models as P } from 'lik-shared';

export type Action =
    | { type: 'LOGIN'; payload: P.Credentials }
    | { type: 'LOGIN_SUCCESS'; payload: P.User }
    | { type: 'LOGIN_FAIL'; payload: string }
    | { type: 'CHECK_IS_LOGGED_IN'; payload: null }
    | { type: 'RESET_IS_LOGGED_IN_STATE'; payload: null }
    | { type: 'SET_IS_LOGGED_OUT'; payload: string }
    | { type: 'SET_IS_LOGGED_IN'; payload: string };
