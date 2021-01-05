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

import * as onoffline from '../actions/onoffline';

export type State = {
    currentClientId: string;
    status: P.WritePermissionStatus;
};

const initialState: State = {
    currentClientId: null,
    status: {
        clientId: null,
        updatedAt: null,
    },
};

export function reducer(state = initialState, action: onoffline.Action): State {
    switch (action.type) {
        case onoffline.LOAD_WRITE_PERMISSION_SUCCESS:
            return { ...state, status: action.payload };
        case onoffline.SET_CURRENT_CLIENT_ID:
            return { ...state, currentClientId: action.payload };

        default:
            return state;
    }
}

export const hasWritePermission = (state: State) =>
    !!state.status.clientId && state.status.clientId === state.currentClientId;
export const canToggleWritePermission = (state: State) =>
    state.status.clientId === null || state.status.clientId === state.currentClientId;
