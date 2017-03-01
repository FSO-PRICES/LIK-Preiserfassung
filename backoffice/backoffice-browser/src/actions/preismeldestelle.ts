import { Models as P } from '../common-models';

export type Actions =
    { type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: { preismeldestellen: P.AdvancedPreismeldestelle[] } } |
    { type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload: P.AdvancedPreismeldestelle } |
    { type: 'SELECT_PREISMELDESTELLE', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: P.AdvancedPreismeldestelle };
