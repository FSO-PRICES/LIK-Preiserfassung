import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatten } from 'lodash';
import { concat, defer, from, iif, of } from 'rxjs';

import { Models as P, PreismeldungAction, preismeldungId, preismeldungRefId } from '@lik-shared';

import { concatMap, delay, flatMap, map, withLatestFrom } from 'rxjs/operators';
import * as controlling from '../actions/controlling';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import {
    blockIfNotLoggedInOrHasNoWritePermission,
    SimpleAction,
    blockIfNotLoggedIn,
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
    preControllingTasks$ = this.actions$.ofType('RUN_PRE-CONTROLLING_TASKS').pipe(
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store, true),
        flatMap(() => copyUserDbErheberDetailsToPreiserheberDb()),
        map(() => ({ type: 'RUN_PRE-CONTROLLING_TASKS_SUCCESS' })),
    );

    @Effect()
    runControlling$ = this.actions$.ofType(controlling.RUN_CONTROLLING).pipe(
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
    selectControllingPm$ = this.actions$.ofType(controlling.SELECT_CONTROLLING_PM).pipe(
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
