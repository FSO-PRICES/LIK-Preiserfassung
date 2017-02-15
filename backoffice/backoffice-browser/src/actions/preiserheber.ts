import { Erheber } from '../common-models';

export type Actions =
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: { preiserhebers: Erheber[] } } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: Erheber } |
    { type: 'SELECT_PREISERHEBER', payload: string } |
    { type: 'UPDATE_CURRENT_PREISERHEBER', payload: Erheber };
