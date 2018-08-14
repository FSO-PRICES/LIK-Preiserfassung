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
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import * as fromRoot from '../reducers';
import * as preismeldungenStatus from '../actions/preismeldungen-status';
import { Models as P, preismeldungId } from 'lik-shared';
import {
    dbNames,
    getDocumentByKeyFromDb,
    downloadDatabaseAsync,
    getLocalDatabase,
    uploadDatabaseAsync,
    getAllPreismeldungenStatus,
    updateMissingPreismeldungenStatus,
} from '../common/pouchdb-utils';
import { getAllDocumentsForPrefixFromUserDbs } from '../common/user-db-values';

@Injectable()
export class PreismeldungenStatusEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    setPreismeldungStatus$ = this.actions$
        .ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS)
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action => setPreismeldungStatus(action.payload))
        .publishReplay(1)
        .refCount();

    setPreismeldungStatusBulk$ = this.actions$
        .ofType(preismeldungenStatus.SET_PREISMELDUNGEN_STATUS_BULK)
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action => setPreismeldungStatusBulk(action.payload))
        .publishReplay(1)
        .refCount();

    @Effect()
    loadPreismeldungenStatusData$ = this.actions$
        .ofType(preismeldungenStatus.LOAD_PREISMELDUNGEN_STATUS)
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(action =>
            getAllPreismeldungenStatus().then(payload =>
                preismeldungenStatus.createLoadPreismeldungenStatusSuccessAction(payload.statusMap)
            )
        );

    @Effect()
    setPreismeldungStatusSuccess$ = this.setPreismeldungStatus$
        .merge(this.setPreismeldungStatusBulk$)
        .map(status => preismeldungenStatus.createSetPreismeldungenStatusSuccessAction(status.statusMap));

    @Effect()
    setPreismeldungenStatusInitializing$ = this.actions$
        .ofType(preismeldungenStatus.INITIALIZE_PREISMELDUNGEN_STATUS)
        .flatMap(() =>
            Observable.concat(
                [preismeldungenStatus.createSetPreismeldungenStatusAreInitializingAction()],
                getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).flatMap(preismeldungen =>
                    updateMissingPreismeldungenStatus(preismeldungen).then(status =>
                        preismeldungenStatus.createLoadPreismeldungenStatusSuccessAction(
                            status.currentPreismeldungenStatus.statusMap,
                            status.count
                        )
                    )
                )
            )
        );

    @Effect()
    syncStatuses$ = this.actions$
        .ofType(preismeldungenStatus.APPLY_PREISMELDUNGEN_STATUS)
        .debounceTime(1000)
        .flatMap(() =>
            uploadPreismeldungStatuses().then(() =>
                preismeldungenStatus.createSyncedPreismeldungenStatusSuccessAction()
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
    return pmStatus;
}

function uploadPreismeldungStatuses() {
    return uploadDatabaseAsync(dbNames.preismeldungen_status);
}
