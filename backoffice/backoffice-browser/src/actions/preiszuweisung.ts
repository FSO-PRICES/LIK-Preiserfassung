import { Models as P } from '../common-models';
import { CurrentPreiszuweisung } from '../reducers/preiszuweisung';

export type Action =
    { type: 'CREATE_USER_DATABASE', payload: CurrentPreiszuweisung } |
    { type: 'PREISZUWEISUNG_LOAD', payload: null } |
    { type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: { preiszuweisungen: P.Preiszuweisung[] } } |
    { type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload: CurrentPreiszuweisung } |
    { type: 'SAVE_PREISZUWEISUNG', payload: string } |
    { type: 'CREATE_PREISZUWEISUNG', payload: string } |
    { type: 'SELECT_OR_CREATE_PREISZUWEISUNG', payload: string } |
    { type: 'UPDATE_CURRENT_PREISZUWEISUNG', payload: P.Preiszuweisung } |
    { type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: P.Preismeldestelle } |
    { type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: P.Preismeldestelle };
