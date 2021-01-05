/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Models as P } from '@lik-shared';

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
        case 'SET_IS_LOGGED_OUT': {
            return Object.assign({}, state, { isLoggedIn: false, user: null });
        }
        case 'SET_IS_LOGGED_IN': {
            return Object.assign({}, state, { isLoggedIn: true, user: { username: action.payload } });
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
