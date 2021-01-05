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
    | { type: 'LOAD_DATABASE_LAST_SYNCED_FAILURE'; payload: any }
    | { type: 'CHECK_DATABASE_FAILURE'; payload: any }
    | { type: 'DELETE_DATABASE_FAILURE'; payload: any }
    | { type: 'LOAD_ERHEBUNGSINFO_FAILURE'; payload: any }
    | { type: 'SAVE_PREISERHEBER_FAILURE'; payload: any }
    | { type: 'PREISMELDESTELLEN_LOAD_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDESTELLE_FAILURE'; payload: any }
    | { type: 'PREISMELDUNGEN_LOAD_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_PRICE_FAILURE'; payload: any }
    | { type: 'SAVE_NEW_PREISMELDUNG_PRICE_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_MESSAGES_FAILURE'; payload: any }
    | { type: 'SAVE_PREISMELDUNG_ATTRIBUTES_FAILURE'; payload: any }
    | { type: 'RESET_PREISMELDUNG_FAILURE'; payload: any }
    | { type: 'DELETE_PREISMELDUNG_FAILURE'; payload: any }
    | { type: 'PREISMELDUNGEN_SORT_SAVE_FAILURE'; payload: any }
    | { type: 'PREISMELDUNG_STATISTICS_LOAD_FAILURE'; payload: any };
