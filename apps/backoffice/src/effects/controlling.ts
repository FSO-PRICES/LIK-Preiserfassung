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
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatten } from 'lodash';
import { concat, defer, from, iif, of } from 'rxjs';

import { Models as P, PreismeldungAction, preismeldungId, preismeldungRefId } from '@lik-shared';

import { concatMap, delay, flatMap, map, withLatestFrom } from 'rxjs/operators';
import * as controlling from '../actions/controlling';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import {
    blockIfNotLoggedIn,
    blockIfNotLoggedInOrHasNoWritePermission,
    SimpleAction,
} from '../common/effects-extensions';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDbName,
    getDatabase,
} from '../common/pouchdb-utils';
import {
    getAllDocumentsForPrefixFromUserDbs,
    loadAllPreiserheber,
    loadAllPreismeldestellen,
} from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class ControllingEffects {
    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    preControllingTasks$ = this.actions$.pipe(
        ofType('RUN_PRE-CONTROLLING_TASKS'),
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store, true),
        flatMap(() => copyUserDbErheberDetailsToPreiserheberDb()),
        map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' })),
    );

    @Effect()
    runControlling$ = this.actions$.pipe(
        ofType(controlling.RUN_CONTROLLING),
        blockIfNotLoggedIn(this.store),
        withLatestFrom(
            this.store.select(fromRoot.getControllingRawCachedData),
            this.store.select(fromRoot.getWarenkorb),
            (action, rawCachedData, warenkorb) => ({
                controllingType: action.payload,
                rawCachedData,
                warenkorb,
            }),
        ),
        flatMap(({ controllingType, rawCachedData, warenkorb }) =>
            concat(
                of(controlling.createRunControllingExecutingAction()),
                iif(
                    () => !!rawCachedData,
                    of({ controllingType, data: rawCachedData }).pipe(delay(500)),
                    defer(() => from(loadDataForControlling())).pipe(
                        map(data => ({
                            controllingType,
                            data,
                        })),
                    ),
                ).pipe(
                    concatMap(x => [
                        {
                            type: 'UPDATE_PRICE_COUNT_STATUSES',
                            payload: { ...x.data, warenkorb },
                        } as PreismeldungAction,
                        controlling.createRunControllingDataReadyAction(x.controllingType, x.data),
                    ]),
                ),
            ),
        ),
    );

    @Effect()
    // TODO Fix types
    selectControllingPm$ = this.actions$.pipe(
        ofType(controlling.SELECT_CONTROLLING_PM),
        map((action: any) => action.payload),
        withLatestFrom(this.store.select(fromRoot.getControllingRawCachedData), (pmId, controllingRawCachedData) => {
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
                    x => x.gliederungspositionsnummer === epNummer,
                ) as P.WarenkorbLeaf,
                exported: controllingRawCachedData.alreadyExported.some(id => id === preismeldung._id),
                hasPriceWarning: false,
            });
        }),
    );
}

async function loadDataForControlling() {
    const alreadyExported = await getAllDocumentsFromDbName<any>(dbNames.exports)
        .pipe(map(docs => flatten(docs.map(doc => (doc.preismeldungIds as string[]) || []))))
        .toPromise();

    const refPreismeldungen = await getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
        await getDatabase(dbNames.preismeldungen),
        preismeldungRefId(),
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
