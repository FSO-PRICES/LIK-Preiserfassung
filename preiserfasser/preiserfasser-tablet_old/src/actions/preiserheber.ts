import { Models as P } from '../common-models';

export type Action =
    { type: 'LOAD_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'LOAD_PREISERHEBER_FAIL' } |
    { type: 'LOAD_PREISERHEBER', payload: null } |
    { type: 'SAVE_PREISERHEBER_SUCCESS', payload: P.Erheber } |
    { type: 'SAVE_PREISERHEBER', payload: null } |
    { type: 'UPDATE_PREISERHEBER', payload: P.Erheber };
