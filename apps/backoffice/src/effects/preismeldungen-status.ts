/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concat, from } from 'rxjs';
import { debounceTime, filter, flatMap, map, merge, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as preismeldungenStatus from '../actions/preismeldungen-status';
import {
    SimpleAction,
    blockIfNotLoggedIn,
    blockIfNotLoggedInOrHasNoWritePermission,
    toNullOnConflict,
} from '../common/effects-extensions';
import { setPouchdbDirty } from '../common/local-storage-utils';
import {
    dbNames,
    getAllPreismeldungenStatus,
    getDocumentByKeyFromDb,
    getLocalDatabase,
    updateMissingPreismeldungenStatus,
    uploadDatabaseAsync,
} from '../common/pouchdb-utils';
import {
    getAllUploadedPm,
    getMissingPreismeldungenStatusCount,
    updateMissingStichtage,
} from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class PreismeldungenStatusEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    setPreismeldungStatus$ = this.actions$.pipe(
        ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS),
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        flatMap((action) => setPreismeldungStatus(action.payload).catch(toNullOnConflict)),
        publishReplay(1),
        refCount(),
    );

    setPreismeldungStatusBulk$ = this.actions$.pipe(
        ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_BULK),
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        flatMap((action) => setPreismeldungStatusBulk(action.payload).catch(toNullOnConflict)),
        publishReplay(1),
        refCount(),
    );

    removePreismeldungStatus$ = createEffect(() =>
        this.actions$.pipe(
            ofType(preismeldungenStatus.REMOVE_PREISMELDUNG_STATUS),
            blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
            flatMap((action) => removePreismeldungStatus(action.payload).catch(toNullOnConflict)),
            map((status) => preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(status.statusMap)),
            publishReplay(1),
            refCount(),
        ),
    );

    loadPreismeldungenStatusData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS),
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                getAllPreismeldungenStatus().then((payload) =>
                    preismeldungenStatus.createLoadPreismeldungenStatusSuccessAction(payload.statusMap),
                ),
            ),
        ),
    );

    getMissingPreismeldungenStatusCount$ = createEffect(() =>
        this.actions$.pipe(
            ofType(preismeldungenStatus.GET_MISSING_PREISMELDUNGEN_STATUS_COUNT),
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                concat(
                    [preismeldungenStatus.createGetMissingPreismeldungenStatusCountResetAction()],
                    getMissingPreismeldungenStatusCount().then((count) =>
                        preismeldungenStatus.createGetMissingPreismeldungenStatusCountSuccessAction(count),
                    ),
                ),
            ),
        ),
    );

    setPreismeldungStatusSuccess$ = createEffect(() =>
        this.setPreismeldungStatus$.pipe(
            merge(this.setPreismeldungStatusBulk$),
            filter((status) => status !== null),
            map((status) => preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(status.statusMap)),
        ),
    );

    setPreismeldungenStatusInitializing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(preismeldungenStatus.INITIALIZE_PREISMELDUNGEN_STATUS),
            blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
            switchMap(() => getAllUploadedPm()),
            switchMap((preismeldungen) =>
                concat(
                    [preismeldungenStatus.createSetPreismeldungenStatusAreInitializingAction()],
                    from(updateMissingStichtage(preismeldungen).then(() => preismeldungen)).pipe(
                        switchMap((preismeldungen) =>
                            updateMissingPreismeldungenStatus(preismeldungen).then((status) =>
                                preismeldungenStatus.createSetPreismeldungenStatusInitializedAction(
                                    status.count,
                                    status.currentPreismeldungenStatus.statusMap,
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        ),
    );

    syncStatuses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(preismeldungenStatus.APPLY_PREISMELDUNGEN_STATUS),
            blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store, true),
            debounceTime(1000),
            flatMap(() =>
                uploadPreismeldungStatuses().then(() =>
                    preismeldungenStatus.createSyncedPreismeldungenStatusSuccessAction(),
                ),
            ),
        ),
    );
}

async function removePreismeldungStatus(pmId: string) {
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const pmStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(db, 'preismeldungen_status');
    delete pmStatus.statusMap[pmId];
    setPouchdbDirty(true);
    await db.put(pmStatus);
    return pmStatus;
}

async function setPreismeldungStatus({ pmId, status }) {
    return setPreismeldungStatusBulk([{ pmId: pmId, status }]);
}

async function setPreismeldungStatusBulk(data: P.PreismeldungStatusList) {
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const pmStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(db, 'preismeldungen_status');
    data.forEach(({ pmId, status }) => {
        pmStatus.statusMap[pmId] = status;
    });
    setPouchdbDirty(true);
    await db.put(pmStatus);
    return pmStatus;
}

function uploadPreismeldungStatuses() {
    const update = uploadDatabaseAsync(dbNames.preismeldungen_status);
    setPouchdbDirty(false);
    return update;
}
