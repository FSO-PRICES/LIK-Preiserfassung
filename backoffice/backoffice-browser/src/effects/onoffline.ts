import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { continueEffectOnlyIfTrue } from '../common/effects-extensions';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as onoffline from '../actions/onoffline';
import { dbNames, getSettings, getDatabase, getDatabaseAsObservable } from './pouchdb-utils';
import { CurrentSetting } from '../reducers/setting';

@Injectable()
export class OnOfflineEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadOnOffline$ = this.actions$
        .ofType('LOAD_ONOFFLINE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() =>
            Observable.from(getOnOfflineStatus()).map(
                payload => ({ type: 'LOAD_ONOFFLINE_SUCCESS', payload } as onoffline.Action)
            )
        );

    @Effect()
    toggleOnOffline$ = this.actions$
        .ofType('TOGGLE_ONOFFLINE')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() =>
            Observable.from(toggleOnOfflineStatus()).map(
                payload => ({ type: 'LOAD_ONOFFLINE_SUCCESS', payload } as onoffline.Action)
            )
        );
}

const onOfflineStatusDocName = 'onoffline_status';
async function getOnOfflineStatus() {
    const db = await getDatabase(dbNames.onoffline);
    let onOfflineStatus;
    try {
        onOfflineStatus = await db.get<P.OnOfflineStatus>(onOfflineStatusDocName);
    } catch (err) {
        // document does not exist, ignore and handle below
    }
    if (!onOfflineStatus) {
        await db.put({ _id: onOfflineStatusDocName, isOffline: false, updatedAt: new Date() });
        onOfflineStatus = await db.get<P.OnOfflineStatus>(onOfflineStatusDocName);
    }
    return onOfflineStatus;
}

async function toggleOnOfflineStatus() {
    const onOfflineStatus = await getOnOfflineStatus();
    const db = await getDatabase(dbNames.onoffline);
    await db.put({ ...onOfflineStatus, isOffline: !onOfflineStatus.isOffline, updatedAt: new Date() });
    return await getOnOfflineStatus();
}
