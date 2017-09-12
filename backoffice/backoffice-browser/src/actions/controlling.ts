import { Models as P } from 'lik-shared';

export const UPDATE_STICHTAGE = 'UPDATE_STICHTAGE';
export const UPDATE_STICHTAGE_SUCCESS = 'UPDATE_STICHTAGE_SUCCESS';
export const RUN_CONTROLLING = 'RUN_CONTROLLING';
export const RUN_CONTROLLING_DATA_READY = 'RUN_CONTROLLING_DATA_READY';

export const CONTROLLING_0100 = 'CONTROLLING_0100';
export const CONTROLLING_0200 = 'CONTROLLING_0200';

export type CONTROLLING_TYPE = typeof CONTROLLING_0100 | typeof CONTROLLING_0100;
export type ControllingData = { preismeldungen: P.Preismeldung[], refPreismeldungen: P.PreismeldungReference[], warenkorb: P.WarenkorbDocument };

export type ControllingAction =
    { type: typeof UPDATE_STICHTAGE } |
    { type: typeof UPDATE_STICHTAGE_SUCCESS; payload: P.Preismeldung[]; } |
    { type: typeof RUN_CONTROLLING; payload: CONTROLLING_TYPE; } |
    { type: typeof RUN_CONTROLLING_DATA_READY; payload: { controllingType: CONTROLLING_TYPE, data: ControllingData } };

export const createUpdateStichtageAction = (): ControllingAction => ({ type: UPDATE_STICHTAGE });
export const createUpdateStichtageSuccessAction = (preismeldungen: P.Preismeldung[]): ControllingAction => ({ type: UPDATE_STICHTAGE_SUCCESS, payload: preismeldungen });

export const createRunControllingAction = (controllingType: CONTROLLING_TYPE): ControllingAction => ({ type: RUN_CONTROLLING, payload: controllingType });
export const createRunControllingDataReadyAction = (controllingType: CONTROLLING_TYPE, data: ControllingData): ControllingAction => ({ type: RUN_CONTROLLING_DATA_READY, payload: { controllingType, data } });
