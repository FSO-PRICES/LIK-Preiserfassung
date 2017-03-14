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
    loadSetting$ = this.actions$
        .ofType('SETTING_LOAD')
        .switchMap(() => getSettings())
        .map<setting.Actions>(docs => {
            return !!docs ?
                { type: 'SETTING_LOAD_SUCCESS', payload: docs } :
                { type: 'SETTING_LOAD_FAIL' } ;
        });

    @Effect()
    saveSetting$ = this.actions$
        .ofType('SAVE_SETTING')
        .withLatestFrom(this.currentSetting$, (action, currentSetting: CurrentSetting) => ({ currentSetting }))
        .switchMap<CurrentSetting>(({ currentSetting }) => {
            return getLocalDatabase(dbNames.setting)
                .then(db => { // Only check if the document exists if a revision not already exists
                    if (!!currentSetting._rev) {
                        return db.get(currentSetting._id).then(doc => ({ db, doc }));
                    }
                    return new Promise<{ db, doc }>((resolve, _) => resolve({ db, doc: {} }));
                })
                .then(({ db, doc }) => { // Create or update the preismeldestelle
                    const create = !doc._rev;
                    const dbOperation = (create ? db.post : db.put).bind(db);
                    return dbOperation(Object.assign({}, doc, <P.Setting>{
                        _id: currentSetting._id,
                        _rev: currentSetting._rev,
                        serverConnection: currentSetting.serverConnection
                    })).then((response) => ({ db, id: response.id }));
                })
                .then<CurrentSetting>(({ db, id }) => db.get(id).then(setting => Object.assign({}, setting, { isModified: false, isSaved: true })));
        })
        .map<setting.Actions>(payload => ({ type: 'SAVE_SETTING_SUCCESS', payload }));
}
