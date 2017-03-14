import { Models as P } from '../common-models';

export type Actions =
    { type: 'PREISMELDUNG_LOAD_SUCCESS', payload: { preismeldungen: P.CompletePreismeldung[] } } |
    { type: 'PREISMELDUNG_LOAD', payload: null };
