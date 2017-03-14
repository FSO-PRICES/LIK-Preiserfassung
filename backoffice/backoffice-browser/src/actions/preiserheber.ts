import { Models as P } from '../common-models';

export type Actions =
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: { preiserhebers: P.Erheber[] } } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'SAVE_PREISERHEBER', payload: string } | // payload is password for db creation (only set if creating)
    { type: 'SELECT_PREISERHEBER', payload: string } |
    { type: 'CREATE_PREISERHEBER', payload: null } |
    { type: 'UPDATE_CURRENT_PREISERHEBER', payload: P.Erheber } |
    { type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: null } |
    { type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: null };
