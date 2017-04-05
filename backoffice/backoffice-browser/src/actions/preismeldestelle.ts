import { Models as P } from '../common-models';

export type Action =
    { type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: { preismeldestellen: P.AdvancedPreismeldestelle[] } } |
    { type: 'PREISMELDESTELLE_LOAD', payload: null } |
    { type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload: P.AdvancedPreismeldestelle } |
    { type: 'SAVE_PREISMELDESTELLE', payload: null } |
    { type: 'SELECT_PREISMELDESTELLE', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: P.AdvancedPreismeldestelle };
