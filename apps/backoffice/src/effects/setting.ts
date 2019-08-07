import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatMap, map, withLatestFrom } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as setting from '../actions/setting';
import { dbNames, getLocalDatabase, getSettings } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';
import { CurrentSetting } from '../reducers/setting';

@Injectable()
export class SettingEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadSetting$ = this.actions$.ofType('SETTING_LOAD').pipe(
        flatMap(() => getSettings()),
        map(docs =>
            !!docs
                ? ({ type: 'SETTING_LOAD_SUCCESS', payload: docs } as setting.Action)
                : ({ type: 'SETTING_LOAD_FAIL' } as setting.Action),
        ),
    );

    @Effect()
    saveSetting$ = this.actions$.ofType('SAVE_SETTING').pipe(
        withLatestFrom(this.currentSetting$, (_, currentSetting: CurrentSetting) => ({ currentSetting })),
        flatMap(({ currentSetting }) =>
            getLocalDatabase(dbNames.settings)
                .then(db => {
                    // Only check if the document exists if a revision already exists
                    if (!!currentSetting._rev) {
                        return db.get(currentSetting._id).then(doc => ({ db, doc }));
                    }
                    return Promise.resolve({ db, doc: {} as P.CouchProperties });
                })
                .then(({ db, doc }) => {
                    // Create or update the setting
                    const create = !doc._rev;
                    const setting = Object.assign({}, doc, <P.Setting>{
                        _id: currentSetting._id,
                        _rev: currentSetting._rev,
                        serverConnection: currentSetting.serverConnection,
                        general: currentSetting.general,
                        transportRequestSettings: currentSetting.transportRequestSettings,
                        export: currentSetting.export,
                    });
                    return (create ? db.post(setting) : db.put(setting)).then(response => ({ db, id: response.id }));
                })
                .then(({ db, id }) =>
                    db.get(id).then(setting => Object.assign({}, setting, { isModified: false, isSaved: true })),
                ),
        ),
        map(payload => ({ type: 'SAVE_SETTING_SUCCESS', payload } as setting.Action)),
    );
}
