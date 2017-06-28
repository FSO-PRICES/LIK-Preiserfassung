import { Models as P } from 'lik-shared';

import * as login from '../actions/login';

export interface State {
    isLoggedIn: boolean;
    loginError: string;
    user: P.User;
};

const initialState: State = {
    isLoggedIn: null,
    loginError: null,
    user: null
};

export function reducer(state = initialState, action: login.Action): State {
    switch (action.type) {
        case 'RESET_IS_LOGGED_IN_STATE': {
            return Object.assign({}, state, { isLoggedIn: null });
        }
        case 'SET_IS_LOGGED_IN': {
            return Object.assign({}, state, { isLoggedIn: true, user: { username: action.payload }, loginError: null });
        }
        case 'SET_IS_LOGGED_OUT': {
            return Object.assign({}, state, { isLoggedIn: false, user: null });
        }
        case 'LOGIN_SUCCESS': {
            return Object.assign({}, state, { isLoggedIn: true, user: action.payload, loginError: null });
        }
        case 'LOGIN_FAIL': {
            return Object.assign({}, state, { isLoggedIn: false, user: null, loginError: action.payload });
        }
        default:
            return state;
    }
}

export const getIsLoggedIn = (state: State) => state.isLoggedIn;
export const getLoggedInUser = (state: State) => state.user;
export const getLoginError = (state: State) => state.loginError;
