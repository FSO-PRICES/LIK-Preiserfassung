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

export type Actions =
    | { type: 'PREISMELDESTELLEN_LOAD_SUCCESS'; payload: P.Preismeldestelle[] }
    | { type: 'PREISMELDESTELLEN_RESET'; payload: null }
    | { type: 'PREISMELDUNGEN_LOAD_SUCCESS'; payload: { pms: P.Preismeldestelle } }
    | { type: 'PREISMELDUNGEN_RESET'; payload: null }
    | { type: 'PREISMELDESTELLE_SELECT'; payload: string }
    | { type: 'RESET_SELECTED_PREISMELDESTELLE' }
    | { type: 'UPDATE_CURRENT_PREISMELDESTELLE'; payload: P.Preismeldestelle }
    | { type: 'SAVE_PREISMELDESTELLE_SUCCESS'; payload: P.Preismeldestelle }
    | { type: 'SAVE_PREISMELDESTELLE'; payload: null };
