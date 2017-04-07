import { Models as P } from '../common-models';

export type Action =
    { type: 'PREISMELDUNG_LOAD_UNEXPORTED', payload: null } |
    { type: 'PREISMELDUNG_LOAD_UNEXPORTED_SUCCESS', payload: P.CompletePreismeldung[] } |
    { type: 'PREISMELDUNG_LOAD_FOR_PMS', payload: null } |
    { type: 'PREISMELDUNG_LOAD_FOR_PMS_SUCCESS', payload: { preismeldungen: P.Preismeldung[], refPreismeldungen: P.PreismeldungReference[], warenkorbDoc: P.WarenkorbDocument, pms: P.Preismeldestelle } } |
    { type: 'CLEAR_PREISMELDUNG_FOR_PMS', payload: null } |
    { type: 'SAVE_PREISMELDUNG', payload: null } |
    { type: 'SAVE_PREISMELDUNG_SUCCESS', payload: P.Preismeldung } |
    { type: 'SELECT_PREISMELDUNG', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDUNG', payload: P.Preismeldung };