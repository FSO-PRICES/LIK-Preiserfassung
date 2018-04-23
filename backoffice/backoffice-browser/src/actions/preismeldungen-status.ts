import { Models as P, PreismeldungBag } from 'lik-shared';

export const LOAD_PREISMELDUNGEN_STATUS = 'LOAD_PREISMELDUNGEN_STATUS';
export const LOAD_PREISMELDUNGEN_STATUS_SUCCESS = 'LOAD_PREISMELDUNGEN_STATUS_SUCCESS';
export const LOAD_PREISMELDUNGEN_STATUS_FAILURE = 'LOAD_PREISMELDUNGEN_STATUS_FAILRE';
export const SET_PREISMELDUNGEN_STATUS = 'SET_PREISMELDUNGEN_STATUS';
export const SET_PREISMELDUNGEN_STATUS_BULK = 'SET_PREISMELDUNGEN_STATUS_BULK';
export const SET_PREISMELDUNGEN_STATUS_SUCCESS = 'SET_PREISMELDUNGEN_STATUS_SUCCESS';

export type PreismeldungenStatusPayload = { [pmId: string]: P.PreismeldungStatus };

export type Action =
    | { type: typeof LOAD_PREISMELDUNGEN_STATUS }
    | { type: typeof LOAD_PREISMELDUNGEN_STATUS_SUCCESS; payload: PreismeldungenStatusPayload }
    | { type: typeof SET_PREISMELDUNGEN_STATUS; payload: { pmId: string; status: P.PreismeldungStatus } }
    | { type: typeof SET_PREISMELDUNGEN_STATUS_BULK; payload: { pmId: string; status: P.PreismeldungStatus }[] }
    | { type: typeof SET_PREISMELDUNGEN_STATUS_SUCCESS; payload: { [pmId: string]: P.PreismeldungStatus } };

export const createLoadPreismeldungenStatusAction = (): Action => ({
    type: LOAD_PREISMELDUNGEN_STATUS,
});
export const createLoadPreismeldungenStatusSuccessAction = (payload: PreismeldungenStatusPayload): Action => ({
    type: LOAD_PREISMELDUNGEN_STATUS_SUCCESS,
    payload,
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
