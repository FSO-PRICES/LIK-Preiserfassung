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

import { Models as P } from 'lik-shared';

export type Action =
    { type: 'LOGIN', payload: P.Credentials } |
    { type: 'LOGIN_SUCCESS', payload: P.User } |
    { type: 'LOGIN_FAIL', payload: string } |
    { type: 'CHECK_IS_LOGGED_IN' } |
    { type: 'RESET_IS_LOGGED_IN_STATE' } |
    { type: 'SET_IS_LOGGED_OUT' } |
    { type: 'SET_IS_LOGGED_IN', payload: string };
