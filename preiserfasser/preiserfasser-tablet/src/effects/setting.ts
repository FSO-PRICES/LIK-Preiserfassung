import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { getServerUrl, setServerUrl } from './local-storage-utils';
import * as fromRoot from '../reducers';
import * as setting from '../actions/setting';
import { CurrentSetting } from '../reducers/setting';

@Injectable()
export class SettingEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadSetting$ = this.actions$
        .ofType('LOAD_SETTINGS')
        .map(() => {
            const url = getServerUrl();
            return !!url ?
                { type: 'LOAD_SETTINGS_SUCCESS', payload: { serverConnection: { url } } } as setting.Action :
                { type: 'LOAD_SETTINGS_FAIL' } as setting.Action;
        });

    @Effect()
    saveSetting$ = this.actions$
        .ofType('SAVE_SETTINGS')
        .withLatestFrom(this.currentSetting$, (action, currentSetting: CurrentSetting) => currentSetting)
        .map(currentSetting => {
            setServerUrl(currentSetting.serverConnection.url);
            return { type: 'SAVE_SETTINGS_SUCCESS', payload: currentSetting } as setting.Action;
        });
}
