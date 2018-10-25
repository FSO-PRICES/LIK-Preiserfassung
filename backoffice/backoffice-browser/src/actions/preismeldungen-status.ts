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

import { Models as P, PreismeldungBag } from 'lik-shared';

export const APPLY_PREISMELDUNGEN_STATUS = 'APPLY_PREISMELDUNGEN_STATUS';
export const LOAD_PREISMELDUNGEN_STATUS = 'LOAD_PREISMELDUNGEN_STATUS';
export const LOAD_PREISMELDUNGEN_STATUS_SUCCESS = 'LOAD_PREISMELDUNGEN_STATUS_SUCCESS';
export const LOAD_PREISMELDUNGEN_STATUS_FAILURE = 'LOAD_PREISMELDUNGEN_STATUS_FAILRE';
export const GET_MISSING_PREISMELDUNGEN_STATUS_COUNT = 'GET_MISSING_PREISMELDUNGEN_STATUS_COUNT';
export const GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_RESET = 'GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_RESET';
export const GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_SUCCESS = 'GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_SUCCESS';
export const SET_PREISMELDUNGEN_STATUS = 'SET_PREISMELDUNGEN_STATUS';
export const SET_PREISMELDUNGEN_STATUS_BULK = 'SET_PREISMELDUNGEN_STATUS_BULK';
export const SET_PREISMELDUNGEN_STATUS_SUCCESS = 'SET_PREISMELDUNGEN_STATUS_SUCCESS';
export const INITIALIZE_PREISMELDUNGEN_STATUS = 'INITIALIZE_PREISMELDUNGEN_STATUS';
export const SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING = 'SET_PREISMELDUNGEN_STATUS_INITIALIZING';
export const SET_PREISMELDUNGEN_STATUS_INITIALIZED = 'SET_PREISMELDUNGEN_STATUS_INITIALIZED';
export const SYNCED_PREISMELDUNGEN_STATUS_SUCCESS = 'SYNCED_PREISMELDUNGEN_STATUS_SUCCESS';

export type PreismeldungenStatusPayload = { [pmId: string]: P.PreismeldungStatus };

export type Action =
    | { type: typeof APPLY_PREISMELDUNGEN_STATUS }
    | { type: typeof LOAD_PREISMELDUNGEN_STATUS }
    | {
          type: typeof LOAD_PREISMELDUNGEN_STATUS_SUCCESS;
          payload: { statusMap: PreismeldungenStatusPayload; count?: number };
      }
    | { type: typeof SET_PREISMELDUNGEN_STATUS; payload: { pmId: string; status: P.PreismeldungStatus } }
    | { type: typeof SET_PREISMELDUNGEN_STATUS_BULK; payload: { pmId: string; status: P.PreismeldungStatus }[] }
    | { type: typeof SET_PREISMELDUNGEN_STATUS_SUCCESS; payload: { [pmId: string]: P.PreismeldungStatus } }
    | { type: typeof GET_MISSING_PREISMELDUNGEN_STATUS_COUNT }
    | { type: typeof GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_RESET }
    | { type: typeof GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_SUCCESS; payload: number }
    | { type: typeof INITIALIZE_PREISMELDUNGEN_STATUS }
    | { type: typeof SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING }
    | {
          type: typeof SET_PREISMELDUNGEN_STATUS_INITIALIZED;
          payload: {
              count: number;
              statusMap: {
                  [pmId: string]: P.PreismeldungStatus;
              };
          };
      }
    | { type: typeof SYNCED_PREISMELDUNGEN_STATUS_SUCCESS };

export const createApplyPreismeldungenStatusAction = (): Action => ({
    type: APPLY_PREISMELDUNGEN_STATUS,
});
export const createLoadPreismeldungenStatusAction = (): Action => ({
    type: LOAD_PREISMELDUNGEN_STATUS,
});
export const createLoadPreismeldungenStatusSuccessAction = (
    statusMap: PreismeldungenStatusPayload,
    count?: number
): Action => ({
    type: LOAD_PREISMELDUNGEN_STATUS_SUCCESS,
    payload: { statusMap, count },
});
export const createSetPreismeldungenStatusAction = (payload: {
    pmId: string;
    status: P.PreismeldungStatus;
}): Action => ({
    type: SET_PREISMELDUNGEN_STATUS,
    payload,
});
export const createSetPreismeldungenStatusBulkAction = (
    payload: {
        pmId: string;
        status: P.PreismeldungStatus;
    }[]
): Action => ({
    type: SET_PREISMELDUNGEN_STATUS_BULK,
    payload,
});
export const createSetPreismeldungenStatusSuccessAction = (payload: {
    [pmId: string]: P.PreismeldungStatus;
}): Action => ({
    type: SET_PREISMELDUNGEN_STATUS_SUCCESS,
    payload,
});
export const createGetMissingPreismeldungenStatusCountAction = (): Action => ({
    type: GET_MISSING_PREISMELDUNGEN_STATUS_COUNT,
});
export const createGetMissingPreismeldungenStatusCountResetAction = (): Action => ({
    type: GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_RESET,
});
export const createGetMissingPreismeldungenStatusCountSuccessAction = (payload: number): Action => ({
    type: GET_MISSING_PREISMELDUNGEN_STATUS_COUNT_SUCCESS,
    payload,
});
export const createInitializePreismeldungenStatusAction = (): Action => ({
    type: INITIALIZE_PREISMELDUNGEN_STATUS,
});
export const createSetPreismeldungenStatusAreInitializingAction = (): Action => ({
    type: SET_PREISMELDUNGEN_STATUS_ARE_INITIALIZING,
});
export const createSetPreismeldungenStatusInitializedAction = (
    count: number,
    statusMap: {
        [pmId: string]: P.PreismeldungStatus;
    }
): Action => ({
    type: SET_PREISMELDUNGEN_STATUS_INITIALIZED,
    payload: { count, statusMap },
});
export const createSyncedPreismeldungenStatusSuccessAction = (): Action => ({
    type: SYNCED_PREISMELDUNGEN_STATUS_SUCCESS,
});
