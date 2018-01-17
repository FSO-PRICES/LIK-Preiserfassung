import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, cloneDeep, flatMap, isEqual } from 'lodash';
import { format, startOfMonth } from 'date-fns';

import * as P from '../common-models';
import {
    createVorReduktionProperties,
    propertiesFromCurrentPreismeldung,
    messagesFromCurrentPreismeldung,
    productMerkmaleFromCurrentPreismeldung,
    PreismeldungAction,
    SavePreismeldungPriceSaveActionSave,
    SavePreismeldungPriceSaveActionCommentsType,
    SavePreismeldungPriceSaveActionAktionType,
} from 'lik-shared';

import {
    getDatabase,
    getDatabaseAsObservable,
    getAllDocumentsFromDb,
    dbNames,
    getAllDocumentsForPrefix,
} from './pouchdb-utils';
import { loadPreismeldungenAndRefPreismeldungForPms } from '../common/user-db-values';
import { Action } from '../actions/preismeldung';
import * as fromRoot from '../reducers';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { CurrentPreismeldungBag } from '../reducers/preismeldung';
import { Observable } from 'rxjs';

@Injectable()
export class PreismeldungEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungenForPms$ = this.actions$
        .ofType('PREISMELDUNGEN_LOAD_FOR_PMS')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload: pmsNummer }) => loadPreismeldungenAndRefPreismeldungForPms(pmsNummer))
        .withLatestFrom(this.store.select(fromRoot.getWarenkorbState), (x, warenkorb) =>
            assign({ ...x, warenkorb, pmsPreismeldungenSort: null })
        )
        .map(
            docs =>
                ({
                    type: 'PREISMELDUNGEN_LOAD_SUCCESS',
                    payload: { ...docs, isAdminApp: true },
                } as PreismeldungAction)
        );

    @Effect()
    savePreismeldungPrice$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({
            currentPreismeldung,
            payload: action.payload,
        }))
        .map(({ currentPreismeldung, payload }) => ({
            currentPreismeldung: assign({}, currentPreismeldung, {
                preismeldung: {
                    ...currentPreismeldung.preismeldung,
                    ...createVorReduktionProperties(currentPreismeldung),
                },
            }),
            payload,
        }))
        .flatMap(x => {
            const saveAction = x.payload as SavePreismeldungPriceSaveActionSave;
            let currentPreismeldung = x.currentPreismeldung;
            const kommentarAutotext = x.currentPreismeldung.messages.kommentarAutotext;
            const aktionAtions = saveAction.saveWithData.filter(
                y => y.type === 'AKTION'
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
            return this.savePreismeldungPrice(currentPreismeldung).map(preismeldung => ({ preismeldung, saveAction }));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    savePreismeldungMessages$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_MESSAGES')
        .withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung
        )
        .flatMap(currentPreismeldung => this.savePreismeldungMessages(currentPreismeldung))
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_MESSAGES_SUCCESS', payload }));

    @Effect()
    savePreismeldungAttributes$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_ATTRIBUTES')
        .withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung
        )
        .flatMap(currentPreismeldung => this.savePreismeldungAttributes(currentPreismeldung))
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_ATTRIBUTES_SUCCESS', payload }));

    savePreismeldung(
        currentPreismeldungBag: P.CurrentPreismeldungBag,
        copyFns: ((bag: P.CurrentPreismeldungBag) => any)[]
    ) {
        return getDatabaseAsObservable(dbNames.preiszuweisung)
            .flatMap(db => getAllDocumentsFromDb<P.Models.Preiszuweisung>(db))
            .flatMap(preiszuweisungen => {
                const preiszuweisung = preiszuweisungen.find(x =>
                    x.preismeldestellenNummern.some(n => n === currentPreismeldungBag.preismeldung.pmsNummer)
                );
                return getDatabaseAsObservable(`user_${preiszuweisung.preiserheberId}`);
            })
            .flatMap(db => db.get(currentPreismeldungBag.preismeldung._id).then(doc => ({ db, doc })))
            .flatMap(({ db, doc }) => {
                const copyObjects = copyFns.map(x => x(currentPreismeldungBag));
                return db.put(assign({}, doc, ...copyObjects)).then(() => db);
            })
            .flatMap(db => db.get(currentPreismeldungBag.preismeldung._id) as Promise<P.Models.Preismeldung>);
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
