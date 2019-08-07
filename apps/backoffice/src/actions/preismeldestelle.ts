import { Models as P } from '../common-models';

export type Action =
    { type: 'PREISMELDESTELLE_UNEXPORTED_RESET', payload: null } |
    { type: 'PREISMELDESTELLE_LOAD_UNEXPORTED_SUCCESS', payload: P.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_LOAD_SUCCESS', payload: P.Preismeldestelle[] } |
    { type: 'PREISMELDESTELLE_LOAD', payload: null } |
    { type: 'SAVE_PREISMELDESTELLE_SUCCESS', payload: P.Preismeldestelle } |
    { type: 'SAVE_PREISMELDESTELLE', payload: null } |
    { type: 'SELECT_PREISMELDESTELLE', payload: string } |
    { type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: P.Preismeldestelle };
