import { Models as P } from '@lik-shared';

import * as setting from '../actions/setting';

export type CurrentSetting = P.Setting & {
    isModified: boolean;
    isSaved: boolean;
    isDefault: boolean;
};

export interface State {
    settings: CurrentSetting;
    sedex: P.SedexSettingsProperties;
    currentSettings: CurrentSetting;
    isFullscreen: boolean;
    hasExportedDatabases: P.DatabaseBackupResult;
    hasImportedDatabase: P.DatabaseImportResult;
}

const initialState: State = {
    settings: undefined,
    sedex: {
        export: { targetPath: null },
        transportRequestSettings: { recipientId: null, senderId: null },
    },
    currentSettings: undefined,
    isFullscreen: false,
    hasExportedDatabases: undefined,
    hasImportedDatabase: undefined,
};

export function reducer(state = initialState, action: setting.Action): State {
    switch (action.type) {
        case 'SETTING_LOAD_SUCCESS': {
            const setting = { ...action.payload, isModified: false, isSaved: false, isDefault: false };
            return { ...state, settings: setting, currentSettings: setting };
        }

        case 'SETTING_LOAD_FAIL': {
            const settings: CurrentSetting = {
                _id: undefined,
                _rev: undefined,
                serverConnection: { url: null },
                general: { erhebungsorgannummer: null },
                version: null,
                isModified: false,
                isSaved: false,
                isDefault: true,
            };
            return { ...state, settings, currentSettings: settings };
        }

        case 'UPDATE_SETTING': {
            const { payload } = action;

            const valuesFromPayload = {
                serverConnection: payload.serverConnection,
                general: payload.general,
            };

            return { ...state, currentSettings: { ...state.settings, ...valuesFromPayload, isModified: true } };
        }

        case 'SAVE_SETTING_SUCCESS': {
            const settings = { ...state.settings, ...action.payload, isDefault: false };
            return { ...state, settings, currentSettings: settings };
        }

        case 'SEDEX_SETTING_LOAD_SUCCESS': {
            return { ...state, sedex: action.payload };
        }

        case 'SEDEX_SETTING_LOAD_FAIL': {
            return {
                ...state,
                sedex: { export: null, transportRequestSettings: { recipientId: null, senderId: null } },
            };
        }

        case 'SAVE_SEDEX_SETTING_SUCCESS': {
            return { ...state, sedex: action.payload };
        }

        case 'EXPORT_DATABASES_SUCCESS': {
            return { ...state, hasImportedDatabase: undefined, hasExportedDatabases: { ...action.payload } };
        }

        case 'IMPORT_DATABASE_SUCCESS': {
            return { ...state, hasImportedDatabase: action.payload, hasExportedDatabases: undefined };
        }

        case 'TOGGLE_FULLSCREEN': {
            return { ...state, isFullscreen: !state.isFullscreen };
        }

        default:
            return state;
    }
}

export const getSettings = (state: State) => state.settings;
export const getCurrentSettings = (state: State) => state.currentSettings;
export const getSedexSettings = (state: State) => state.sedex;
export const getHasExportedDatabases = (state: State) => state.hasExportedDatabases;
export const getHasImportedDatabases = (state: State) => state.hasImportedDatabase;

export const getIsFullscreen = (state: State) => state.isFullscreen;
