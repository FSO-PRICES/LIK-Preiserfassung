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

export type Actions =
    { type: 'DELETE_DATABASE', payload: null } |
    { type: 'DOWNLOAD_DATABASE', payload: { url: string, username: string } } |
    { type: 'UPLOAD_DATABASE', payload: { url: string, username: string } } |
    { type: 'SET_DATABASE_IS_SYNCING', payload: null } |
    { type: 'SYNC_DATABASE', payload: { url: string, username: string } } |
    { type: 'SYNC_DATABASE_SUCCESS', payload: null } |
    { type: 'SYNC_DATABASE_FAILURE', payload: string | any } |
    { type: 'CHECK_CONNECTIVITY_TO_DATABASE', payload: null } |
    { type: 'RESET_CONNECTIVITY_TO_DATABASE', payload: null } |
    { type: 'SET_CONNECTIVITY_STATUS', payload: boolean } |
    { type: 'CHECK_DATABASE_EXISTS', payload: null } |
    { type: 'SET_DATABASE_EXISTS', payload: boolean } |
    { type: 'CHECK_DATABASE_LAST_UPLOADED_AT', payload: null } |
    { type: 'SET_DATABASE_LAST_UPLOADED_AT', payload: Date } |
    { type: 'LOAD_DATABASE_LAST_SYNCED_AT', payload: null } |
    { type: 'LOAD_DATABASE_LAST_SYNCED_AT_SUCCESS', payload: Date };
