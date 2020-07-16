import { Models as P } from '../common-models';
import { CurrentSetting } from '../reducers/setting';

export type Action =
    | { type: 'TOGGLE_ONOFFLINE' }
    | { type: 'SETTING_LOAD_SUCCESS'; payload: P.Setting }
    | { type: 'SETTING_LOAD_FAIL' }
    | { type: 'SETTING_LOAD'; payload: null }
    | { type: 'SEDEX_SETTING_LOAD_SUCCESS'; payload: P.SedexSettings }
    | { type: 'SEDEX_SETTING_LOAD_FAIL' }
    | { type: 'SEDEX_SETTING_LOAD'; payload: null }
    | { type: 'SAVE_SETTING_SUCCESS'; payload: CurrentSetting }
    | { type: 'SAVE_SETTING'; payload: null }
    | { type: 'UPDATE_SETTING'; payload: P.Setting }
    | { type: 'SAVE_SEDEX_SETTING_SUCCESS'; payload: P.SedexSettings }
    | { type: 'SAVE_SEDEX_SETTING'; payload: P.SedexSettingsProperties }
    | { type: 'TOGGLE_FULLSCREEN'; payload: null }
    | { type: 'EXPORT_DATABASES'; payload: null }
    | { type: 'EXPORT_DATABASES_SUCCESS'; payload: P.DatabaseBackupResult }
    | { type: 'IMPORT_DATABASE'; payload: P.DatabaseBackupResult }
    | { type: 'IMPORT_DATABASE_SUCCESS'; payload: P.DatabaseImportResult };
