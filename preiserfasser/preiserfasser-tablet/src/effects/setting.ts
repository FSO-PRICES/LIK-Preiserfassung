/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { getServerUrl, setServerUrl } from './local-storage-utils';
import * as fromRoot from '../reducers';
import * as setting from '../actions/setting';
import { CurrentSetting } from '../reducers/setting';
import { getDatabaseAsObservable } from './pouchdb-utils';

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
            return !!url
                ? { type: 'LOAD_SETTINGS_SUCCESS', payload: { serverConnection: { url } } } as setting.Action
                : { type: 'LOAD_SETTINGS_FAIL' } as setting.Action;
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
