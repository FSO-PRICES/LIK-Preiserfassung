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
    updateMissingPreismeldungenStatus,
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
    updateStichtage$ = this.actions$
        .ofType(controlling.UPDATE_STICHTAGE)
        .flatMap(() => updateStichtage())
        .map(preismeldungen => controlling.createUpdateStichtageSuccessAction(preismeldungen));

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
                    Observable.fromPromise(loadDataForControlling()).map(data => ({
                        controllingType,
                        data,
                    }))
                )
                    .flatMap(x =>
                        updateMissingPreismeldungenStatus(x.data.preismeldungen, x.data.refPreismeldungen).then(
                            preismeldungenStatus => ({
                                ...x,
                                preismeldungenStatus,
                            })
                        )
                    )
                    .concatMap(x => [
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

function updateStichtage() {
    return listUserDatabases()
        .flatMap(dbnames =>
            Observable.forkJoin(
                dbnames.map(dbname =>
                    getDatabaseAsObservable(dbname)
                        .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldung>(db, preismeldungId()))
                        .map(preismeldungen => ({ dbname, preismeldungen }))
                )
            )
        )
        .map(x =>
            flattenDeep<{ dbname: string; preismeldung: P.Preismeldung }>(
                x.map(y => y.preismeldungen.map(preismeldung => ({ preismeldung, dbname: y.dbname })))
            )
        )
        .flatMap(bags =>
            getAllDocumentsForPrefixFromDbName<P.PreismeldungReference>(
                dbNames.preismeldungen,
                preismeldungRefId()
            ).map(refPreismeldungen => ({ refPreismeldungen, bags }))
        )
        .map(({ refPreismeldungen, bags }) => {
            const stichtagPreismeldungen = bags.filter(
                bag => !!bag.preismeldung.uploadRequestedAt && bag.preismeldung.erhebungsZeitpunkt === 99
            );
            return stichtagPreismeldungen
                .map(bag => {
                    const modifiedAt = moment(bag.preismeldung.modifiedAt);
                    const refPreismeldung = refPreismeldungen.find(
                        r =>
                            modifiedAt.isAfter(moment(r.erhebungsAnfangsDatum, 'DD.MM.YYYY')) &&
                            modifiedAt.isBefore(moment(r.erhebungsEndDatum, 'DD.MM.YYYY'))
                    );
                    return {
                        dbname: bag.dbname,
                        preismeldung: assign({}, bag.preismeldung, {
                            erhebungsZeitpunkt: !!refPreismeldung
                                ? refPreismeldung.erhebungsZeitpunkt
                                : bag.preismeldung.erhebungsZeitpunkt,
                        }),
                    };
                })
                .filter(bag => bag.preismeldung.erhebungsZeitpunkt !== 99);
        })
        .map(bags => ({ bags, groups: groupBy(bags, x => x.dbname) }))
        .flatMap(
            ({ groups, bags }) =>
                Object.keys(groups).length === 0
                    ? Observable.of(bags)
                    : Observable.forkJoin(
                          Object.keys(groups).map(dbname =>
                              getDatabaseAsObservable(dbname).flatMap(db =>
                                  db.bulkDocs(groups[dbname].map(x => x.preismeldung))
                              )
                          )
                      ).map(() => bags)
        )
        .map(bags => bags.map(b => b.preismeldung));
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
