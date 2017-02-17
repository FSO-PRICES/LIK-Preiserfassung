import { Models as P } from '../common-models';

export type Actions =
    { type: 'PREISERHEBER_LOAD_SUCCESS', payload: { preiserhebers: P.Erheber[] } } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'SELECT_PREISERHEBER', payload: string } |
    { type: 'UPDATE_CURRENT_PREISERHEBER', payload: P.Erheber };
