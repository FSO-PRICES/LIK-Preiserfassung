import { Models as P } from '../common-models';


export const PreiszuweisungLoad = 'PREISZUWEISUNG_LOAD';
export const PreiszuweisungLoadSuccess = 'PREISZUWEISUNG_LOAD_SUCCESS';
export const SavePreiszuweisung = 'SAVE_PREISZUWEISUNG';
export const SavePreiszuweisungSuccess = 'SAVE_PREISZUWEISUNG_SUCCESS';
export const SelectPreiszuweisung = 'SELECT_PREISZUWEISUNG';
export const UpdateCurrentPreiszuweisung = 'UPDATE_CURRENT_PREISZUWEISUNG';

export type Actions =
    { type: 'PREISZUWEISUNG_LOAD', payload: null } |
    { type: 'PREISZUWEISUNG_LOAD_SUCCESS', payload: { preiszuweisungen: P.Preiszuweisung[] } } |
    { type: 'SAVE_PREISZUWEISUNG_SUCCESS', payload: P.Preiszuweisung } |
    { type: 'SAVE_PREISZUWEISUNG', payload: string } |
    { type: 'SELECT_PREISZUWEISUNG', payload: string } |
    { type: 'UPDATE_CURRENT_PREISZUWEISUNG', payload: P.Preiszuweisung };
