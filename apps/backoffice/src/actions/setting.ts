import { Models as P } from '../common-models';
import { CurrentSetting } from '../reducers/setting';

export type Action =
    | { type: 'TOGGLE_ONOFFLINE' }
    | { type: 'SETTING_LOAD_SUCCESS'; payload: P.Setting }
    | { type: 'SETTING_LOAD_FAIL' }
    | { type: 'SETTING_LOAD'; payload: null }
    | { type: 'SAVE_SETTING_SUCCESS'; payload: CurrentSetting }
    | { type: 'SAVE_SETTING'; payload: null }
    | { type: 'UPDATE_SETTING'; payload: P.Setting }
    | { type: 'TOGGLE_FULLSCREEN'; payload: null };