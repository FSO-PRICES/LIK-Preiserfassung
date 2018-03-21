import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import * as setting from '../actions/setting';

export type CurrentSetting = P.Setting & {
    isModified: boolean;
    isSaved: boolean;
    isDefault: boolean;
};

export interface State {
    settings: CurrentSetting;
    currentSettings: CurrentSetting;
    isFullscreen: boolean;
}

const initialState: State = {
    settings: undefined,
    currentSettings: undefined,
    isFullscreen: false,
};

export function reducer(state = initialState, action: setting.Action): State {
    switch (action.type) {
        case 'SETTING_LOAD_SUCCESS': {
            return assign({}, state, { settings: action.payload, currentSettings: action.payload });
        }

        case 'SETTING_LOAD_FAIL': {
            const settings: CurrentSetting = {
                _id: undefined,
                _rev: undefined,
                serverConnection: { url: null },
                general: { erhebungsorgannummer: null },
                transportRequestSettings: { senderId: null, recipientId: null },
                version: null,
                isModified: false,
                isSaved: false,
                isDefault: true,
            };
            return assign({}, state, { settings, currentSettings: settings });
        }

        case 'UPDATE_SETTING': {
            const { payload } = action;

            const valuesFromPayload = {
                serverConnection: payload.serverConnection,
                general: payload.general,
                transportRequestSettings: payload.transportRequestSettings,
            };

            const currentSettings = assign({}, state.settings, valuesFromPayload, { isModified: true });

            return Object.assign({}, state, { currentSettings });
        }

        case 'SAVE_SETTING_SUCCESS': {
            const settings = Object.assign({}, state.settings, action.payload, { isDefault: false });
            return assign({}, state, { settings, currentSettings: settings });
        }

        case 'TOGGLE_FULLSCREEN': {
            return assign({}, state, { isFullscreen: !state.isFullscreen });
        }

        default:
            return state;
    }
}

export const getSettings = (state: State) => state.settings;
export const getCurrentSettings = (state: State) => state.currentSettings;

export const getIsFullscreen = (state: State) => state.isFullscreen;
