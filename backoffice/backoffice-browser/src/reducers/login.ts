import * as login from '../actions/login';

export interface State {
    isLoggedIn: boolean;
};

const initialState: State = {
    isLoggedIn: null
};

export function reducer(state = initialState, action: login.Actions): State {
    switch (action.type) {
        case 'SET_IS_LOGGED_IN': {
            return Object.assign({}, state, { isLoggedIn: action.payload });
        }
        case 'LOGIN_SUCCESS':
            return Object.assign({}, state, { isLoggedIn: true });

        default:
            return state;
    }
}

export const getIsLoggedIn = (state: State) => state.isLoggedIn;
