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

export const LOAD_COCKPIT_DATA = 'LOAD_COCKPIT_DATA';
export const LOAD_COCKPIT_DATA_EXECUTING = 'LOAD_COCKPIT_DATA_EXECUTING';
export const LOAD_COCKPIT_DATA_SUCCESS = 'LOAD_COCKPIT_DATA_SUCCESS';
export const COCKPIT_PREISERHEBER_SELECTED = 'COCKPIT_PREISERHEBER_SELECTED';

export type Action =
    | { type: typeof LOAD_COCKPIT_DATA }
    | { type: typeof LOAD_COCKPIT_DATA_EXECUTING }
    | {
          type: typeof LOAD_COCKPIT_DATA_SUCCESS;
          payload: {
              lastSyncedAt: { [username: string]: { value: string }[] };
              preismeldungen: P.Preismeldung[];
              refPreismeldungen: P.PreismeldungReference[];
              preismeldestellen: P.Preismeldestelle[];
              preiszuweisungen: P.Preiszuweisung[];
              preiserheber: P.Erheber[];
          };
      }
    | { type: typeof COCKPIT_PREISERHEBER_SELECTED; payload: string };
