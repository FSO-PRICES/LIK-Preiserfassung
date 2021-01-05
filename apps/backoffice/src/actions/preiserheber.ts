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

import { Models as P } from '../common-models';

export type Action =
    { type: 'PREISERHEBER_LOAD', payload: null } |
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: P.Erheber[] } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'SAVE_PREISERHEBER_FAILURE', payload: string } |
    { type: 'SAVE_PREISERHEBER', payload: string } | // payload is password for db creation (only set if creating)
    { type: 'SELECT_PREISERHEBER', payload: string } |
    { type: 'DELETE_PREISERHEBER', payload: P.Erheber } |
    { type: 'DELETE_PREISERHEBER_SUCCESS', payload: string } |
    { type: 'DELETE_PREISERHEBER_FAILURE', payload: string } |
    { type: 'CREATE_PREISERHEBER', payload: null } |
    { type: 'RESET_PASSWORD_SUCCESS', payload: null } |
    { type: 'CLEAR_RESET_PASSWORD_STATE', payload: null } |
    { type: 'UPDATE_CURRENT_PREISERHEBER', payload: P.Erheber } |
    { type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: null } |
    { type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: null };
