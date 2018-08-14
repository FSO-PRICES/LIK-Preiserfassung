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
    { type: 'PREISMELDESTELLE_UNEXPORTED_RESET', payload: null } |
    { type: 'PREISMELDESTELLE_LOAD_UNEXPORTED_SUCCESS', payload: P.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: P.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_LOAD', payload: null } |
    { type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload: P.Preismeldestelle } |
    { type: 'SAVE_PREISMELDESTELLE', payload: null } |
    { type: 'SELECT_PREISMELDESTELLE', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: P.Preismeldestelle };
