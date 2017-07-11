import { Models as P } from '../common-models';

export type Action =
    { type: 'LOAD_SETTINGS_SUCCESS', payload: P.Setting & { erhebungsmonat: string; erhebungsorgannummer: string; } } |
    { type: 'LOAD_SETTINGS_FAIL' } |
    { type: 'LOAD_SETTINGS', payload: null } |
    { type: 'SAVE_SETTINGS_SUCCESS', payload: P.Setting } |
    { type: 'SAVE_SETTINGS', payload: null } |
    { type: 'UPDATE_SETTINGS', payload: P.Setting };
