import { Models as P }  from 'lik-shared';

export type Actions =
    { type: 'PREISMELDESTELLEN_LOAD_SUCCESS', payload: P.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLEN_RESET', payload: null } |
    { type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: { pms: P.Preismeldestelle } } |
    { type: 'PREISMELDUNGEN_RESET', payload: null } |
    { type: 'PREISMELDESTELLE_SELECT', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: P.AdvancedPreismeldestelle } |
    { type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload: P.AdvancedPreismeldestelle } |
    { type: 'SAVE_PREISMELDESTELLE', payload: null };
