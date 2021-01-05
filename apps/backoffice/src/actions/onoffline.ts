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

export const CHECK_CONNECTIVITY_TO_DATABASE = 'CHECK_CONNECTIVITY_TO_DATABASE';
export const CAN_CONNECT_TO_DATABASE = 'CAN_CONNECT_TO_DATABASE';
export const LOAD_ONOFFLINE = 'LOAD_ONOFFLINE';
export const LOAD_ONOFFLINE_SUCCESS = 'LOAD_ONOFFLINE_SUCCESS';
export const LOAD_WRITE_PERMISSION = 'LOAD_WRITE_PERMISSION';
export const LOAD_WRITE_PERMISSION_SUCCESS = 'LOAD_WRITE_PERMISSION_SUCCESS';
export const RESET_MIN_VERSION = 'RESET_MIN_VERSION';
export const SAVE_MIN_VERSION = 'SAVE_MIN_VERSION';
export const TOGGLE_ONOFFLINE = 'TOGGLE_ONOFFLINE';
export const TOGGLE_WRITE_PERMISSION = 'TOGGLE_WRITE_PERMISSION';
export const SET_CURRENT_CLIENT_ID = 'SET_CURRENT_CLIENT_ID';

export type Action =
    | { type: typeof CHECK_CONNECTIVITY_TO_DATABASE }
    | { type: typeof CAN_CONNECT_TO_DATABASE; payload: boolean }
    | { type: typeof LOAD_ONOFFLINE }
    | { type: typeof LOAD_ONOFFLINE_SUCCESS; payload: P.OnOfflineStatus }
    | { type: typeof LOAD_WRITE_PERMISSION }
    | { type: typeof LOAD_WRITE_PERMISSION_SUCCESS; payload: P.WritePermissionStatus }
    | { type: typeof RESET_MIN_VERSION }
    | { type: typeof SAVE_MIN_VERSION; payload: string }
    | { type: typeof TOGGLE_ONOFFLINE }
    | { type: typeof TOGGLE_WRITE_PERMISSION; payload: { force?: boolean } }
    | { type: typeof SET_CURRENT_CLIENT_ID; payload: string };
