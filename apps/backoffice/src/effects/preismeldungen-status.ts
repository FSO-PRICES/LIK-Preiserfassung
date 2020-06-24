import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concat } from 'rxjs';
import { debounceTime, flatMap, map, merge, publishReplay, refCount, filter } from 'rxjs/operators';

import { Models as P, preismeldungId } from '@lik-shared';

import * as preismeldungenStatus from '../actions/preismeldungen-status';
import {
    blockIfNotLoggedIn,
    blockIfNotLoggedInOrHasNoWritePermission,
    SimpleAction,
    toNullOnConflict,
} from '../common/effects-extensions';
import {
    dbNames,
    getAllPreismeldungenStatus,
    getDocumentByKeyFromDb,
    getLocalDatabase,
    updateMissingPreismeldungenStatus,
    uploadDatabaseAsync,
} from '../common/pouchdb-utils';
import { getAllDocumentsForPrefixFromUserDbs, getMissingPreismeldungenStatusCount } from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class PreismeldungenStatusEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    setPreismeldungStatus$ = this.actions$.ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS).pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        flatMap(action => setPreismeldungStatus(action.payload).catch(toNullOnConflict)),
        publishReplay(1),
        refCount(),
    );

    setPreismeldungStatusBulk$ = this.actions$.ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_BULK).pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        flatMap(action => setPreismeldungStatusBulk(action.payload).catch(toNullOnConflict)),
        publishReplay(1),
        refCount(),
    );

    @Effect()
    removePreismeldungStatus$ = this.actions$.ofType(preismeldungenStatus.REMOVE_PREISMELDUNG_STATUS).pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        flatMap(action => removePreismeldungStatus(action.payload).catch(toNullOnConflict)),
        map(status => preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(status.statusMap)),
        publishReplay(1),
        refCount(),
    );

    @Effect()
    loadPreismeldungenStatusData$ = this.actions$.ofType(preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS).pipe(
        blockIfNotLoggedIn(this.store),
        flatMap(() =>
            getAllPreismeldungenStatus().then(payload =>
                preismeldungenStatus.createLoadPreismeldungenStatusSuccessAction(payload.statusMap),
            ),
        ),
    );

    @Effect()
    getMissingPreismeldungenStatusCount$ = this.actions$
        .ofType(preismeldungenStatus.GET_MISSING_PREISMELDUNGEN_STATUS_COUNT)
        .pipe(
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                concat(
                    [preismeldungenStatus.createGetMissingPreismeldungenStatusCountResetAction()],
                    getMissingPreismeldungenStatusCount().then(count =>
                        preismeldungenStatus.createGetMissingPreismeldungenStatusCountSuccessAction(count),
                    ),
                ),
            ),
        );

    @Effect()
    setPreismeldungStatusSuccess$ = this.setPreismeldungStatus$.pipe(
        merge(this.setPreismeldungStatusBulk$),
        filter(status => status !== null),
        map(status => preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(status.statusMap)),
    );

    @Effect()
    setPreismeldungenStatusInitializing$ = this.actions$
        .ofType(preismeldungenStatus.INITIALIZE_PREISMELDUNGEN_STATUS)
        .pipe(
            blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
            flatMap(() =>
                concat(
                    [preismeldungenStatus.createSetPreismeldungenStatusAreInitializingAction()],
                    getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).pipe(
                        flatMap(preismeldungen =>
                            updateMissingPreismeldungenStatus(preismeldungen).then(status =>
                                preismeldungenStatus.createSetPreismeldungenStatusInitializedAction(
                                    status.count,
                                    status.currentPreismeldungenStatus.statusMap,
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        );

    @Effect()
    syncStatuses$ = this.actions$.ofType(preismeldungenStatus.APPLY_PREISMELDUNGEN_STATUS).pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store, true),
        debounceTime(1000),
        flatMap(() =>
            uploadPreismeldungStatuses().then(() =>
                preismeldungenStatus.createSyncedPreismeldungenStatusSuccessAction(),
            ),
        ),
    );
}

async function removePreismeldungStatus(pmId: string) {
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const pmStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(db, 'preismeldungen_status');
    delete pmStatus.statusMap[pmId];
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
    await db.put(pmStatus);
    return pmStatus;
}

function uploadPreismeldungStatuses() {
    return uploadDatabaseAsync(dbNames.preismeldungen_status);
}
