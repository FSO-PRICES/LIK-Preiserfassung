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

import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as setting from '../actions/setting';

export type CurrentSetting = P.Setting & {
    isModified: boolean;
    isDefault: boolean;
    isSaved: boolean;
};

export interface State {
    settings: CurrentSetting;
    currentSettings: CurrentSetting;
};

const initialState: State = {
    settings: null,
    currentSettings: null
};

export function reducer(state = initialState, action: setting.Action): State {
    switch (action.type) {
        case 'SET_VERSION': {
            return {
                ...state,
                settings: { ...state.settings, version: action.payload },
                currentSettings: { ...state.currentSettings, version: action.payload }
            };
        }

        case 'LOAD_SETTINGS_SUCCESS': {
            const settings = assign({}, state.currentSettings, action.payload, { isDefault: false, isModified: false });
            return assign({}, state, { settings, currentSettings: settings });
        }

        case 'LOAD_SETTINGS_FAIL': {
            const settings = assign({}, { serverConnection: null, isDefault: true, isModified: false });
            return assign({}, state, { settings, currentSettings: settings });
        }

        case 'UPDATE_SETTINGS': {
            const { payload } = action;

            const valuesFromPayload = {
                serverConnection: payload.serverConnection
            };

            const currentSettings = assign({},
                state.settings,
                valuesFromPayload,
                { isModified: true, isSaved: false },
            );

            return { ...state, currentSettings };
        }

        case 'SAVE_SETTINGS_SUCCESS': {
            const settings = Object.assign({}, state.settings, action.payload, { isDefault: false, isModified: false, isSaved: true });
            return assign({}, state, { settings, currentSettings: settings });
        }

        default:
            return state;
    }
}

export const getSettings = (state: State) => state.settings;
export const getCurrentSettings = (state: State) => state.currentSettings;
