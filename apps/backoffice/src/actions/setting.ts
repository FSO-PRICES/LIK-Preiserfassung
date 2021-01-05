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
