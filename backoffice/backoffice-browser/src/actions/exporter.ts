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

export type Action =
    { type: 'EXPORT_PREISMELDUNGEN' } |
    { type: 'EXPORT_PREISMELDUNGEN_RESET', payload: null } |
    { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: number } |
    { type: 'EXPORT_PREISMELDUNGEN_FAILURE', payload: number } |
    { type: 'EXPORT_PREISMELDESTELLEN' } |
    { type: 'EXPORT_PREISMELDESTELLEN_RESET', payload: null } |
    { type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: number } |
    { type: 'EXPORT_PREISMELDESTELLEN_FAILURE', payload: number } |
    { type: 'EXPORT_PREISERHEBER', payload: string } |
    { type: 'EXPORT_PREISERHEBER_RESET', payload: null } |
    { type: 'EXPORT_PREISERHEBER_SUCCESS', payload: number } |
    { type: 'EXPORT_PREISERHEBER_FAILURE', payload: number };
