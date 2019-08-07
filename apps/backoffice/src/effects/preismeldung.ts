import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign } from 'lodash';
import { filter, flatMap } from 'rxjs/operators';

import {
    copyPreismeldungPropertiesFromRefPreismeldung,
    createVorReduktionProperties,
    messagesFromCurrentPreismeldung,
    pmsSortId,
    PreismeldungAction,
    productMerkmaleFromCurrentPreismeldung,
    propertiesFromCurrentPreismeldung,
    SavePreismeldungPriceSaveActionAktionType,
    SavePreismeldungPriceSaveActionSave,
} from '@lik-shared';

import { map, withLatestFrom } from 'rxjs/operators';
import * as P from '../common-models';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { dbNames, getAllDocumentsFromDb, getDatabaseAsObservable } from '../common/pouchdb-utils';
import { loadPreismeldungenAndRefPreismeldungForPms } from '../common/user-db-values';
import * as fromRoot from '../reducers';

@Injectable()
export class PreismeldungEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungenForPms$ = this.actions$.ofType('PREISMELDUNGEN_LOAD_FOR_PMS').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(({ payload: pmsNummer }) => loadPreismeldungenAndRefPreismeldungForPms({ pmsNummers: [pmsNummer] })),
        withLatestFrom(this.store.select(fromRoot.getWarenkorbState), (x, warenkorb) =>
            assign({ ...x, warenkorb, pmsPreismeldungenSort: null }),
        ),
        map(
            docs =>
                ({
                    type: 'PREISMELDUNGEN_LOAD_SUCCESS',
                    payload: { ...docs, isAdminApp: true },
                } as PreismeldungAction),
        ),
    );

    @Effect()
    loadPreismeldungenForId$ = this.actions$.ofType('PREISMELDUNGEN_LOAD_BY_FILTER').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        flatMap(({ payload }) => loadPreismeldungenAndRefPreismeldungForPms(payload)),
        withLatestFrom(this.store.select(fromRoot.getWarenkorbState), (x, warenkorb) =>
            assign({ ...x, warenkorb, pmsPreismeldungenSort: null }),
        ),
        map(
            docs =>
                ({
                    type: 'PREISMELDUNGEN_LOAD_SUCCESS',
                    payload: { ...docs, isAdminApp: true },
                } as PreismeldungAction),
        ),
    );

    @Effect()
    // TODO Fix types
    savePreismeldungPrice$ = this.actions$.ofType('SAVE_PREISMELDUNG_PRICE').pipe(
        withLatestFrom(this.currentPreismeldung$, (action: any, currentPreismeldung: P.CurrentPreismeldungBag) => ({
            currentPreismeldung,
            payload: action.payload,
        })),
        map(({ currentPreismeldung, payload }) => ({
            currentPreismeldung: assign({}, currentPreismeldung, {
                preismeldung: {
                    ...currentPreismeldung.preismeldung,
                    ...createVorReduktionProperties(currentPreismeldung),
                },
            }),
            payload,
        })),
        flatMap(x => {
            const saveAction = x.payload as SavePreismeldungPriceSaveActionSave;
            let currentPreismeldung = x.currentPreismeldung;
            const kommentarAutotext = x.currentPreismeldung.messages.kommentarAutotext;
            const aktionAtions = saveAction.saveWithData.filter(
                y => y.type === 'AKTION',
            ) as SavePreismeldungPriceSaveActionAktionType[];
            if (aktionAtions.length > 1) {
                throw new Error(`More than one AKTION: ${JSON.stringify(saveAction)}`);
            }
            const setAktion =
                aktionAtions.length === 1
                    ? {
                          preismeldung: {
                              ...x.currentPreismeldung.preismeldung,
                              aktion: aktionAtions[0].value,
                          },
                      }
                    : null;
            currentPreismeldung = {
                ...x.currentPreismeldung,
                messages: { ...x.currentPreismeldung.messages, kommentarAutotext },
                ...setAktion,
            };
            return this.savePreismeldungPrice(currentPreismeldung).pipe(
                map(preismeldung => ({ preismeldung, saveAction })),
            );
        }),
        map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload })),
    );

    @Effect()
    savePreismeldungMessages$ = this.actions$.ofType('SAVE_PREISMELDUNG_MESSAGES').pipe(
        withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung,
        ),
        flatMap(currentPreismeldung => this.savePreismeldungMessages(currentPreismeldung)),
        map(payload => ({ type: 'SAVE_PREISMELDUNG_MESSAGES_SUCCESS', payload })),
    );

    @Effect()
    savePreismeldungAttributes$ = this.actions$.ofType('SAVE_PREISMELDUNG_ATTRIBUTES').pipe(
        withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung,
        ),
        flatMap(currentPreismeldung => this.savePreismeldungAttributes(currentPreismeldung)),
        map(payload => ({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS', payload })),
    );

    @Effect()
    resetPreismeldung$ = this.actions$.ofType('RESET_PREISMELDUNG').pipe(
        withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung,
        ),
        filter(x => !!x.refPreismeldung),
        flatMap(currentPreismeldung =>
            this.savePreismeldung(currentPreismeldung, [
                bag => copyPreismeldungPropertiesFromRefPreismeldung(bag.refPreismeldung),
            ]),
        ),
        map(payload => ({ type: 'RESET_PREISMELDUNG_SUCCESS', payload })),
    );

    @Effect()
    deletePreismeldung$ = this.actions$.ofType('RESET_PREISMELDUNG').pipe(
        withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung,
        ),
        filter(x => !x.refPreismeldung),
        flatMap(bag =>
            this.getUserDb(bag).pipe(
                flatMap(userDb =>
                    userDb
                        .get(bag.preismeldung._id)
                        .then(doc => ({ userDb, doc }))
                        .then(x => x.userDb.remove(x.doc._id, x.doc._rev))
                        .then(() =>
                            userDb
                                .get(pmsSortId(bag.preismeldung.pmsNummer))
                                .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                                    const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                                        sortOrder: pmsPreismeldungenSort.sortOrder.filter(x => x.pmId !== bag.pmId),
                                    });
                                    return userDb.put(newPmsPreismeldungsSort);
                                })
                                .then(() => bag.preismeldung._id),
                        ),
                ),
            ),
        ),
        map(payload => ({ type: 'DELETE_PREISMELDUNG_SUCCESS', payload })),
    );

    savePreismeldung(
        currentPreismeldungBag: P.CurrentPreismeldungBag,
        copyFns: ((bag: P.CurrentPreismeldungBag) => any)[],
    ) {
        return this.getUserDb(currentPreismeldungBag).pipe(
            flatMap(db => db.get(currentPreismeldungBag.preismeldung._id).then(doc => ({ db, doc }))),
            flatMap(async ({ db, doc }) => {
                const copyObjects = copyFns.map(x => x(currentPreismeldungBag));
                await db.put(assign({}, doc, ...copyObjects));
                return db;
            }),
            flatMap(db => db.get(currentPreismeldungBag.preismeldung._id) as Promise<P.Models.Preismeldung>),
        );
    }

    getUserDb(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return getDatabaseAsObservable(dbNames.preiszuweisungen).pipe(
            flatMap(db => getAllDocumentsFromDb<P.Models.Preiszuweisung>(db)),
            flatMap(preiszuweisungen => {
                const preiszuweisung = preiszuweisungen.find(x =>
                    x.preismeldestellenNummern.some(n => n === currentPreismeldungBag.preismeldung.pmsNummer),
                );
                return getDatabaseAsObservable(`user_${preiszuweisung.preiserheberId}`);
            }),
        );
    }

    savePreismeldungPrice(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [
            bag => propertiesFromCurrentPreismeldung(bag),
            bag => messagesFromCurrentPreismeldung(bag),
        ]);
    }

    savePreismeldungMessages(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [bag => messagesFromCurrentPreismeldung(bag)]);
    }

    savePreismeldungAttributes(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [bag => productMerkmaleFromCurrentPreismeldung(bag)]);
    }
}
