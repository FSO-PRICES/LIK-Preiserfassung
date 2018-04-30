import { Models as P, PreismeldungBag } from 'lik-shared';

export const UPDATE_STICHTAGE = 'UPDATE_STICHTAGE';
export const UPDATE_STICHTAGE_SUCCESS = 'UPDATE_STICHTAGE_SUCCESS';
export const RUN_CONTROLLING = 'RUN_CONTROLLING';
export const CLEAR_CONTROLLING = 'CLEAR_CONTROLLING';
export const RUN_CONTROLLING_EXECUTING = 'RUN_CONTROLLING_EXECUTING';
export const RUN_CONTROLLING_DATA_READY = 'RUN_CONTROLLING_DATA_READY';
export const SELECT_CONTROLLING_PM = 'SELECT_CONTROLLING_PM';
export const SELECT_CONTROLLING_PM_WITH_BAG = 'SELECT_CONTROLLING_PM_WITH_BAG';
export const RESET_PREISMELDUNG_SUCCESS = 'RESET_PREISMELDUNG_SUCCESS';
export const SAVE_PREISMELDUNG_PRICE_SUCCESS = 'SAVE_PREISMELDUNG_PRICE_SUCCESS';
export const SAVE_PREISMELDUNG_MESSAGES_SUCCESS = 'SAVE_PREISMELDUNG_MESSAGES_SUCCESS';
export const SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS = 'SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS';

export const CONTROLLING_0100 = 'CONTROLLING_0100';
export const CONTROLLING_0200 = 'CONTROLLING_0200';
export const CONTROLLING_0110 = 'CONTROLLING_0110';
export const CONTROLLING_0210 = 'CONTROLLING_0210';
export const CONTROLLING_0120 = 'CONTROLLING_0120';
export const CONTROLLING_0220 = 'CONTROLLING_0220';
export const CONTROLLING_0230 = 'CONTROLLING_0230';
export const CONTROLLING_0240 = 'CONTROLLING_0240';
export const CONTROLLING_0250 = 'CONTROLLING_0250';
export const CONTROLLING_0300 = 'CONTROLLING_0300';
export const CONTROLLING_0310 = 'CONTROLLING_0310';
export const CONTROLLING_0320 = 'CONTROLLING_0320';
export const CONTROLLING_0400 = 'CONTROLLING_0400';
export const CONTROLLING_0410 = 'CONTROLLING_0410';
export const CONTROLLING_0420 = 'CONTROLLING_0420';
export const CONTROLLING_0430 = 'CONTROLLING_0430';
export const CONTROLLING_0440 = 'CONTROLLING_0440';
export const CONTROLLING_0500 = 'CONTROLLING_0500';
export const CONTROLLING_0510 = 'CONTROLLING_0510';
export const CONTROLLING_0520 = 'CONTROLLING_0520';
export const CONTROLLING_0530 = 'CONTROLLING_0530';
export const CONTROLLING_0540 = 'CONTROLLING_0540';
export const CONTROLLING_0600 = 'CONTROLLING_0600';
export const CONTROLLING_0700 = 'CONTROLLING_0700';
export const CONTROLLING_0810 = 'CONTROLLING_0810';
export const CONTROLLING_0820 = 'CONTROLLING_0820';
export const CONTROLLING_0830 = 'CONTROLLING_0830';

export type CONTROLLING_TYPE =
    | typeof CONTROLLING_0100
    | typeof CONTROLLING_0100
    | typeof CONTROLLING_0110
    | typeof CONTROLLING_0210
    | typeof CONTROLLING_0120
    | typeof CONTROLLING_0220
    | typeof CONTROLLING_0230
    | typeof CONTROLLING_0240
    | typeof CONTROLLING_0250
    | typeof CONTROLLING_0300
    | typeof CONTROLLING_0310
    | typeof CONTROLLING_0320
    | typeof CONTROLLING_0400
    | typeof CONTROLLING_0410
    | typeof CONTROLLING_0420
    | typeof CONTROLLING_0430
    | typeof CONTROLLING_0440
    | typeof CONTROLLING_0500
    | typeof CONTROLLING_0510
    | typeof CONTROLLING_0520
    | typeof CONTROLLING_0530
    | typeof CONTROLLING_0540
    | typeof CONTROLLING_0600
    | typeof CONTROLLING_0700
    | typeof CONTROLLING_0810
    | typeof CONTROLLING_0820
    | typeof CONTROLLING_0830;

export interface ControllingData {
    alreadyExported: string[];
    preismeldungen: P.Preismeldung[];
    refPreismeldungen: P.PreismeldungReference[];
    warenkorb: P.WarenkorbDocument;
    preismeldestellen: P.Preismeldestelle[];
    preiserheber: P.Erheber[];
    preiszuweisungen: P.Preiszuweisung[];
    preismeldungenStatus: P.PreismeldungenStatus;
}

export type ControllingAction =
    | { type: typeof UPDATE_STICHTAGE }
    | { type: typeof UPDATE_STICHTAGE_SUCCESS; payload: P.Preismeldung[] }
    | { type: typeof RUN_CONTROLLING; payload: CONTROLLING_TYPE }
    | { type: typeof CLEAR_CONTROLLING }
    | { type: typeof RUN_CONTROLLING_EXECUTING }
    | { type: typeof RUN_CONTROLLING_DATA_READY; payload: { controllingType: CONTROLLING_TYPE; data: ControllingData } }
    | { type: typeof SELECT_CONTROLLING_PM; payload: string }
    | { type: typeof SELECT_CONTROLLING_PM_WITH_BAG; payload: PreismeldungBag }
    | { type: typeof RESET_PREISMELDUNG_SUCCESS; payload: P.Preismeldung }
    | { type: typeof SAVE_PREISMELDUNG_PRICE_SUCCESS; payload: { preismeldung: P.Preismeldung } }
    | { type: typeof SAVE_PREISMELDUNG_MESSAGES_SUCCESS; payload: P.Preismeldung }
    | { type: typeof SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS; payload: P.Preismeldung };

export const createUpdateStichtageAction = (): ControllingAction => ({ type: UPDATE_STICHTAGE });
export const createUpdateStichtageSuccessAction = (preismeldungen: P.Preismeldung[]): ControllingAction => ({
    type: UPDATE_STICHTAGE_SUCCESS,
    payload: preismeldungen,
});

export const createRunControllingAction = (controllingType: CONTROLLING_TYPE): ControllingAction => ({
    type: RUN_CONTROLLING,
    payload: controllingType as CONTROLLING_TYPE,
});
export const createClearControllingAction = (): ControllingAction => ({ type: CLEAR_CONTROLLING });
export const createRunControllingExecutingAction = (): ControllingAction => ({ type: RUN_CONTROLLING_EXECUTING });
export const createRunControllingDataReadyAction = (
    controllingType: CONTROLLING_TYPE,
    data: ControllingData
): ControllingAction => ({ type: RUN_CONTROLLING_DATA_READY, payload: { controllingType, data } });
export const createSelectControllingPmAction = (pmId: string): ControllingAction => ({
    type: SELECT_CONTROLLING_PM,
    payload: pmId,
});
export const createSelectControllingPmWithBagAction = (bag: PreismeldungBag): ControllingAction => ({
    type: SELECT_CONTROLLING_PM_WITH_BAG,
    payload: bag,
});
