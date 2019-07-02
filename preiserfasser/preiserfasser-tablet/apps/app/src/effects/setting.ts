import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs/operators';

import * as setting from '../actions/setting';
import * as fromRoot from '../reducers';
import { CurrentSetting } from '../reducers/setting';
import { getServerUrl, setServerUrl } from './local-storage-utils';

@Injectable()
export class SettingEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadSetting$ = this.actions$.ofType('LOAD_SETTINGS').pipe(
        map(() => {
            const url = getServerUrl();
            return !!url
                ? ({ type: 'LOAD_SETTINGS_SUCCESS', payload: { serverConnection: { url } } } as setting.Action)
                : ({ type: 'LOAD_SETTINGS_FAIL' } as setting.Action);
        }),
    );

    @Effect()
    saveSetting$ = this.actions$.ofType('SAVE_SETTINGS').pipe(
        withLatestFrom(this.currentSetting$, (_action, currentSetting: CurrentSetting) => currentSetting),
        map(currentSetting => {
            setServerUrl(currentSetting.serverConnection.url);
            return { type: 'SAVE_SETTINGS_SUCCESS', payload: currentSetting } as setting.Action;
        }),
    );
}
