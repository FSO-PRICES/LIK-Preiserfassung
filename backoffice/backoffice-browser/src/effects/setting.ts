import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as setting from '../actions/setting';
import { getLocalDatabase, dbNames, getSettings } from './pouchdb-utils';
import { CurrentSetting } from '../reducers/setting';

@Injectable()
export class SettingEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadSetting$ = this.actions$.ofType('SETTING_LOAD')
        .flatMap(() => getSettings())
        .map(docs => !!docs ?
            { type: 'SETTING_LOAD_SUCCESS', payload: docs } as setting.Action :
            { type: 'SETTING_LOAD_FAIL' } as setting.Action
        );

    @Effect()
    saveSetting$ = this.actions$.ofType('SAVE_SETTING')
        .withLatestFrom(this.currentSetting$, (action, currentSetting: CurrentSetting) => ({ currentSetting }))
        .flatMap(({ currentSetting }) =>
            getLocalDatabase(dbNames.setting)
                .then(db => { // Only check if the document exists if a revision already exists
                    if (!!currentSetting._rev) {
                        return db.get(currentSetting._id).then(doc => ({ db, doc }));
                    }
                    return Promise.resolve({ db, doc: {} });
                })
                .then(({ db, doc }) => { // Create or update the setting
                    const create = !doc._rev;
                    const setting = Object.assign({}, doc, <P.Setting>{
                        _id: currentSetting._id,
                        _rev: currentSetting._rev,
                        serverConnection: currentSetting.serverConnection,
                        general: currentSetting.general
                    });
                    return (create ? db.post(setting) : db.put(setting))
                        .then((response) => ({ db, id: response.id }));
                })
                .then<CurrentSetting>(({ db, id }) => db.get(id).then(setting => Object.assign({}, setting, { isModified: false, isSaved: true })))
        )
        .map(payload => ({ type: 'SAVE_SETTING_SUCCESS', payload } as setting.Action));
}
