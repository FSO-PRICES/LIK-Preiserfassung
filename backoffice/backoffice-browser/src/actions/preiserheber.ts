import { Models as P } from '../common-models';

export type Action =
    { type: 'PREISERHEBER_LOAD' } |
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: { preiserhebers: P.Erheber[] } } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'SAVE_PREISERHEBER_FAILURE', payload: string } |
    { type: 'SAVE_PREISERHEBER', payload: string } | // payload is password for db creation (only set if creating)
    { type: 'SELECT_PREISERHEBER', payload: string } |
    { type: 'DELETE_PREISERHEBER', payload: P.Erheber } |
    { type: 'DELETE_PREISERHEBER_SUCCESS', payload: string } |
    { type: 'DELETE_PREISERHEBER_FAILURE', payload: string } |
    { type: 'CREATE_PREISERHEBER', payload: null } |
    { type: 'RESET_PASSWORD_SUCCESS', payload: null } |
    { type: 'CLEAR_RESET_PASSWORD_STATE', payload: null } |
    { type: 'UPDATE_CURRENT_PREISERHEBER', payload: P.Erheber } |
    { type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: null } |
    { type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: null };
