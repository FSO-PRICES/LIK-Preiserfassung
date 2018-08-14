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
import { assign, groupBy, flattenDeep, flatten } from 'lodash';
import { Observable } from 'rxjs';
import * as moment from 'moment';

import * as controlling from '../actions/controlling';
import {
    getAllDocumentsForPrefixFromUserDbs,
    loadAllPreismeldestellen,
    loadAllPreiserheber,
} from '../common/user-db-values';
import {
    getAllDocumentsForPrefixFromDbName,
    listUserDatabases,
    dbNames,
    getDatabase,
    getDatabaseAsObservable,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDbName,
    getAllPreismeldungenStatus,
} from '../common/pouchdb-utils';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import * as fromRoot from '../reducers';

import { Models as P, PreismeldungBag, preismeldungRefId, preismeldungId, PreismeldungAction } from 'lik-shared';

@Injectable()
export class ControllingEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    preControllingTasks$ = this.actions$
        .ofType('RUN_PRE-CONTROLLING_TASKS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => copyUserDbErheberDetailsToPreiserheberDb())
        .map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' }));

    @Effect()
    runControlling$ = this.actions$
        .ofType(controlling.RUN_CONTROLLING)
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .withLatestFrom(
            this.store.select(fromRoot.getControllingRawCachedData),
            this.store.select(fromRoot.getWarenkorbState),
            (action, rawCachedData, warenkorb) => ({
                controllingType: action.payload,
                rawCachedData,
                warenkorb,
            })
        )
        .flatMap(({ controllingType, rawCachedData, warenkorb }) =>
            Observable.concat(
                Observable.of(controlling.createRunControllingExecutingAction()),
                Observable.if(
                    () => !!rawCachedData,
                    Observable.of({ controllingType, data: rawCachedData }).delay(500),
                    Observable.defer(() => Observable.fromPromise(loadDataForControlling())).map(data => ({
                        controllingType,
                        data,
                    }))
                ).concatMap(x => [
                    {
                        type: 'UPDATE_PRICE_COUNT_STATUSES',
                        payload: { ...x.data, warenkorb },
                    } as PreismeldungAction,
                    controlling.createRunControllingDataReadyAction(x.controllingType, x.data),
                ])
            )
        );

    @Effect()
    selectControllingPm$ = this.actions$
        .ofType(controlling.SELECT_CONTROLLING_PM)
        .map(({ payload }) => payload)
        .withLatestFrom(this.store.select(fromRoot.getControllingRawCachedData), (pmId, controllingRawCachedData) => {
            if (!pmId) {
                return controlling.createSelectControllingPmWithBagAction(null);
            }

            const refPreismeldung = controllingRawCachedData.refPreismeldungen.find(x => x.pmId === pmId);
            const preismeldung = controllingRawCachedData.preismeldungen.find(x => x._id === pmId);
            const epNummer = (refPreismeldung || preismeldung).epNummer;
            return controlling.createSelectControllingPmWithBagAction({
                pmId,
                refPreismeldung,
                sortierungsnummer: null,
                preismeldung,
                warenkorbPosition: controllingRawCachedData.warenkorb.products.find(
                    x => x.gliederungspositionsnummer === epNummer
                ) as P.WarenkorbLeaf,
                exported: controllingRawCachedData.alreadyExported.some(id => id === preismeldung._id),
            });
        });
}

async function loadDataForControlling() {
    const alreadyExported = await getAllDocumentsFromDbName<any>(dbNames.exports)
        .map(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || [])))
        .toPromise();

    const refPreismeldungen = await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
        await getDatabase(dbNames.preismeldungen),
        preismeldungRefId()
    );

    const preismeldungen = await getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).toPromise();
    const preismeldestellen = await loadAllPreismeldestellen().toPromise();
    const preiserheber = await loadAllPreiserheber().toPromise();
    const warenkorb = await (await getDatabase(dbNames.warenkorb)).get<P.WarenkorbDocument>('warenkorb');
    const preiszuweisungen = await getAllDocumentsFromDbName<P.Preiszuweisung>(dbNames.preiszuweisungen).toPromise();

    return {
        refPreismeldungen,
        preismeldungen,
        preismeldestellen,
        preiserheber,
        warenkorb,
        alreadyExported,
        preiszuweisungen,
    };
}
