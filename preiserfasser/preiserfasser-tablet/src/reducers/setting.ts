import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as setting from '../actions/setting';
import { environment } from '../environments/environment';

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

const defaultSetting = { version: environment.version };

export function reducer(state = initialState, action: setting.Action): State {
    switch (action.type) {
        case 'LOAD_SETTINGS_SUCCESS': {
            const settings = assign({}, state.currentSettings, action.payload, { isDefault: false, isModified: false }, defaultSetting);
            return assign({}, state, { settings, currentSettings: settings });
        }

        case 'LOAD_SETTINGS_FAIL': {
            const settings = assign({}, { serverConnection: null, isDefault: true, isModified: false }, defaultSetting);
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
                defaultSetting
            );

            return Object.assign({}, state, { currentSettings });
        }

        case 'SAVE_SETTINGS_SUCCESS': {
            const settings = Object.assign({}, state.settings, action.payload, { isDefault: false, isModified: false, isSaved: true }, defaultSetting);
            return assign({}, state, { settings, currentSettings: settings });
        }

        default:
            return state;
    }
}

export const getSettings = (state: State) => state.settings;
export const getCurrentSettings = (state: State) => state.currentSettings;
