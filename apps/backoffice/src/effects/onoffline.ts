import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { from, of } from 'rxjs';
import { catchError, flatMap, map, take } from 'rxjs/operators';

import { continueEffectOnlyIfTrue } from '../common/effects-extensions';

import { Models as P } from '@lik-shared';

import * as onoffline from '../actions/onoffline';
import { checkConnectivity, dbNames, getDatabase } from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';

@Injectable()
export class OnOfflineEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadOnOffline$ = this.actions$.ofType('LOAD_ONOFFLINE').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(() =>
            from(getOnOfflineStatus()).pipe(
                map(payload => ({ type: 'LOAD_ONOFFLINE_SUCCESS', payload } as onoffline.Action)),
            ),
        ),
    );

    @Effect()
    toggleOnOffline$ = this.actions$.ofType('TOGGLE_ONOFFLINE').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(() =>
            from(toggleOnOfflineStatus()).pipe(
                map(payload => ({ type: 'LOAD_ONOFFLINE_SUCCESS', payload } as onoffline.Action)),
            ),
        ),
    );

    @Effect()
    saveMinVersion$ = this.actions$.ofType('SAVE_MIN_VERSION').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(({ payload }) => setMinVersion(payload)),
        flatMap(payload => [
            { type: 'RESET_MIN_VERSION' } as onoffline.Action,
            { type: 'LOAD_ONOFFLINE_SUCCESS', payload } as onoffline.Action,
        ]),
    );

    @Effect()
    canConnectToDatabase$ = this.actions$.ofType('CHECK_CONNECTIVITY_TO_DATABASE').pipe(
        flatMap(() =>
            this.store.select(fromRoot.getSettings).pipe(
                take(1),
                flatMap(settings =>
                    !!settings && !settings.isDefault
                        ? checkConnectivity(settings.serverConnection.url).pipe(catchError(() => of(false)))
                        : of(false),
                ),
                map(canConnect => ({ type: 'CAN_CONNECT_TO_DATABASE', payload: canConnect } as onoffline.Action)),
            ),
        ),
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

async function setMinVersion(minVersion: string) {
    const onOfflineStatus = await getOnOfflineStatus();
    const db = await getDatabase(dbNames.onoffline);
    await db.put({ ...onOfflineStatus, minVersion });
    return await getOnOfflineStatus();
}
