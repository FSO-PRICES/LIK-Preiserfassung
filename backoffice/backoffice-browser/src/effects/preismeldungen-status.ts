import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as preismeldungenStatus from '../actions/preismeldungen-status';
import { Models as P } from 'lik-shared';
import {
    dbNames,
    getDocumentByKeyFromDb,
    downloadDatabaseAsync,
    getLocalDatabase,
    uploadDatabaseAsync,
    getAllPreismeldungenStatus,
} from '../common/pouchdb-utils';

@Injectable()
export class PreismeldungenStatusEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungenStatusData$ = this.actions$
        .ofType('LOAD_PREISMELDUNGEN_STATUS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action =>
            getAllPreismeldungenStatus().then(payload =>
                preismeldungenStatus.createLoadPreismeldungenStatusSuccessAction(payload)
            )
        );

    @Effect()
    setPreismeldungStatus$ = this.actions$
        .ofType('SET_PREISMELDUNGEN_STATUS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .switchMap(action =>
            setPreismeldungStatus(action.payload).then(payload =>
                preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(payload)
            )
        );

    @Effect()
    setPreismeldungStatusBulk$ = this.actions$
        .ofType('SET_PREISMELDUNGEN_STATUS_BULK')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action =>
            setPreismeldungStatusBulk(action.payload).then(payload =>
                preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(payload)
            )
        );
}

async function setPreismeldungStatus({ pmId, status }) {
    return setPreismeldungStatusBulk([{ pmId: pmId, status }]);
}

async function setPreismeldungStatusBulk(data: { pmId: string; status: P.PreismeldungStatus }[]) {
    const db = await getLocalDatabase(dbNames.preismeldungen_status);
    const pmStatus = await getDocumentByKeyFromDb<P.PreismeldungenStatus>(db, 'preismeldungen_status');
    data.forEach(({ pmId, status }) => {
        pmStatus.statusMap[pmId] = status;
    });
    await db.put(pmStatus);
    await uploadDatabaseAsync(dbNames.preismeldungen_status);
    return pmStatus.statusMap;
}
