import { Models as P } from 'lik-shared';

export type Action =
    | { type: 'LOGIN'; payload: P.Credentials }
    | { type: 'LOGIN_SUCCESS'; payload: P.User }
    | { type: 'LOGIN_FAIL'; payload: string }
    | { type: 'LOGOUT'; payload: boolean }
    | { type: 'CHECK_IS_LOGGED_IN' }
    | { type: 'RESET_IS_LOGGED_IN_STATE' }
    | { type: 'SET_IS_LOGGED_OUT' }
    | { type: 'SET_IS_LOGGED_IN'; payload: string };
