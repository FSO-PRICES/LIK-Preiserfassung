import { Models as P } from 'lik-shared';

import * as login from '../actions/login';

export interface State {
    isLoggedIn: boolean;
    user: P.User;
};

const initialState: State = {
    isLoggedIn: null,
    user: null
};

export function reducer(state = initialState, action: login.Action): State {
    switch (action.type) {
        case 'SET_IS_LOGGED_OUT': {
            return Object.assign({}, state, { isLoggedIn: false, user: null });
        }
        case 'SET_IS_LOGGED_IN': {
            return Object.assign({}, state, { isLoggedIn: true, user: { username: action.payload } });
        }
        case 'LOGIN_SUCCESS': {
            return Object.assign({}, state, { isLoggedIn: true, user: action.payload });
        }
        case 'LOGIN_FAIL': {
            return Object.assign({}, state, { isLoggedIn: false, user: null });
        }
        default:
            return state;
    }
}

export const getIsLoggedIn = (state: State) => state.isLoggedIn;
