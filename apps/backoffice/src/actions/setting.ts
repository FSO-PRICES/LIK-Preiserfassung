import { createAction, props } from '@ngrx/store';

import { ReturnOf } from '@lik-shared/common';

import { Models as P } from '../common-models';
import { CurrentSetting } from '../reducers/setting';

export type Action =
    | { type: 'TOGGLE_ONOFFLINE' }
    | { type: 'SETTING_LOAD_SUCCESS'; payload: P.Setting }
    | { type: 'SETTING_LOAD_FAIL' }
    | { type: 'SETTING_LOAD'; payload: null }
    | ReturnOf<typeof loadSedex>
    | ReturnOf<typeof loadSedexSuccess>
    | ReturnOf<typeof loadSedexFailure>
    | { type: 'SAVE_SETTING_SUCCESS'; payload: CurrentSetting }
    | { type: 'SAVE_SETTING'; payload: null }
    | { type: 'UPDATE_SETTING'; payload: P.Setting }
    | ReturnOf<typeof saveSedex>
    | ReturnOf<typeof saveSedexSuccess>
    | { type: 'TOGGLE_FULLSCREEN'; payload: null }
    | { type: 'EXPORT_DATABASES'; payload: null }
    | { type: 'EXPORT_DATABASES_SUCCESS'; payload: P.DatabaseBackupResult }
    | { type: 'IMPORT_DATABASE'; payload: P.DatabaseBackupResult }
    | { type: 'IMPORT_DATABASE_SUCCESS'; payload: P.DatabaseImportResult };

export const saveSedexSuccess = createAction('SAVE_SEDEX_SETTING_SUCCESS', props<{ payload: P.SedexSettings }>());
export const saveSedex = createAction('SAVE_SEDEX_SETTING', props<{ payload: P.SedexSettingsProperties }>());
export const loadSedex = createAction('LOAD_SEDEX_SETTING');
export const loadSedexSuccess = createAction('LOAD_SEDEX_SETTING_SUCCESS', props<{ payload: P.SedexSettings }>());
export const loadSedexFailure = createAction('LOAD_SEDEX_SETTING_FAILURE');
