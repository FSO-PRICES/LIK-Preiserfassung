import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { startOfMonth } from 'date-fns';
import { assign, cloneDeep, flatMap, isEqual, maxBy, sortBy } from 'lodash';
import { Observable } from 'rxjs/Observable';

import {
    getDatabase,
    getAllDocumentsForPrefix,
    getAllDocumentsForPrefixFromDb,
    getDatabaseAsObservable,
    getDocumentWithFallback,
} from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';
import {
    preismeldungCompareFn,
    SavePreismeldungPriceSaveActionCommentsType,
    SavePreismeldungPriceSaveActionAktionType,
    createVorReduktionProperties,
    propertiesFromCurrentPreismeldung,
    messagesFromCurrentPreismeldung,
    productMerkmaleFromCurrentPreismeldung,
    preismeldungId,
    preismeldestelleId,
    PreismeldungAction,
    copyPreismeldungPropertiesFromRefPreismeldung,
} from 'lik-shared';
import { of } from 'rxjs/observable/of';

@Injectable()
export class PreismeldungenEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    isInRecordMode$ = this.store.select(fromRoot.getPreismeldungenIsInRecordMode);
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    loadPreismeldungen$ = this.actions$.ofType('PREISMELDUNGEN_LOAD_FOR_PMS').flatMap(({ payload: pmsNummer }) =>
        Observable.defer(async () => {
            const db = await getDatabase();
            return {
                db,
                refPreismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.PreismeldungReference>(
                    db,
                    P.preismeldungRefId(pmsNummer)
                ),
                preismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.Preismeldung>(
                    db,
                    P.preismeldungId(pmsNummer)
                ),
                pmsPreismeldungenSort: await getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                    db,
                    P.pmsSortId(pmsNummer)
                ),
            };
        })
            .flatMap(async x => {
                const missingPreismeldungs = x.refPreismeldungen
                    .filter(rpm => !x.preismeldungen.find(pm => pm._id === rpm.pmId))
                    .map(rpm => ({
                        _id: P.preismeldungId(rpm.pmsNummer, rpm.epNummer, rpm.laufnummer),
                        _rev: undefined,
                        ...copyPreismeldungPropertiesFromRefPreismeldung(rpm),
                    }));

                const pmsPreismeldungenSort = x.pmsPreismeldungenSort || {
                    _id: P.pmsSortId(pmsNummer),
                    _rev: null,
                };

                if (missingPreismeldungs.length === 0) {
                    return x;
                }

                const newPmsPreismeldungenSort = assign({}, pmsPreismeldungenSort, {
                    sortOrder: x.refPreismeldungen
                        .filter(rpm => !pmsPreismeldungenSort[rpm.pmId])
                        .sort(preismeldungCompareFn)
                        .map((rpm, i) => ({ pmId: rpm.pmId, sortierungsnummer: i + 1 })),
                });

                await x.db.bulkDocs((missingPreismeldungs as any[]).concat([newPmsPreismeldungenSort]));

                return {
                    pmsNummer: pmsNummer,
                    db: x.db,
                    refPreismeldungen: x.refPreismeldungen,
                    preismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.Preismeldung>(
                        x.db,
                        P.preismeldungId(pmsNummer)
                    ),
                    pmsPreismeldungenSort: await getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                        x.db,
                        P.pmsSortId(pmsNummer)
                    ),
                };
            })
            .flatMap(async x => ({
                ...x,
                pms: await x.db.get<P.Models.Preismeldestelle>(preismeldestelleId(pmsNummer)),
            }))
            .combineLatest(
                this.store
                    .select(fromRoot.getWarenkorb)
                    .filter(x => !!x.length)
                    .take(1),
                (x, warenkorb) => ({
                    isAdminApp: false,
                    pms: x.pms,
                    warenkorb,
                    refPreismeldungen: x.refPreismeldungen,
                    preismeldungen: x.preismeldungen,
                    pmsPreismeldungenSort: x.pmsPreismeldungenSort,
                    alreadyExported: [],
                })
            )
            .map(payload => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload } as PreismeldungAction))
    );

    savePreismeldungPrice$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({
            currentPreismeldung,
            payload: action.payload,
        }))
        .map(({ currentPreismeldung, payload }) => ({
            currentPreismeldung: {
                ...currentPreismeldung,
                preismeldung: {
                    ...currentPreismeldung.preismeldung,
                    ...createVorReduktionProperties(currentPreismeldung),
                    erfasstAt: +new Date(),
                },
            },
            payload,
        }))
        .publishReplay(1)
        .refCount();

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice$
        .filter(x => !x.currentPreismeldung.isNew)
        .flatMap(x =>
            this.applySortierungen(x.currentPreismeldung)
                .defaultIfEmpty()
                .map(sortierung => ({ ...x, sortierung }))
        )
        .flatMap(x => {
            const saveAction = x.payload as P.SavePreismeldungPriceSaveActionSave;
            let currentPreismeldung = x.currentPreismeldung;
            const kommentarAutotext = flatMap(
                saveAction.saveWithData
                    .filter(x => x.type === 'COMMENT')
                    .map((x: SavePreismeldungPriceSaveActionCommentsType) => x.comments)
            );
            const aktionAtions = saveAction.saveWithData.filter(
                x => x.type === 'AKTION'
            ) as SavePreismeldungPriceSaveActionAktionType[];
            if (aktionAtions.length > 1) {
                throw new Error(`More than one AKTION: ${JSON.stringify(saveAction)}`);
            }
            const setAktion =
                aktionAtions.length === 1
                    ? {
                          preismeldung: assign({}, x.currentPreismeldung.preismeldung, {
                              aktion: aktionAtions[0].value,
                          }),
                      }
                    : null;
            currentPreismeldung = assign(
                {},
                x.currentPreismeldung,
                { messages: assign({}, x.currentPreismeldung.messages, { kommentarAutotext }) },
                setAktion
            );
            return this.savePreismeldungPrice(currentPreismeldung).then(preismeldung => ({
                preismeldung,
                sortierung: x.sortierung,
                saveAction,
            }));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    saveNewPreismeldung$ = this.savePreismeldungPrice$
        .filter(x => x.currentPreismeldung.isNew)
        .flatMap(({ currentPreismeldung }) =>
            getDatabase()
                .then((
                    db // save Preismeldung
                ) =>
                    db
                        .put(
                            assign(
                                {},
                                {
                                    _id: currentPreismeldung.preismeldung._id,
                                    _rev: null,
                                    epNummer: currentPreismeldung.preismeldung.epNummer,
                                    laufnummer: currentPreismeldung.preismeldung.laufnummer,
                                    pmsNummer: currentPreismeldung.preismeldung.pmsNummer,
                                },
                                propertiesFromCurrentPreismeldung(currentPreismeldung),
                                messagesFromCurrentPreismeldung(currentPreismeldung),
                                productMerkmaleFromCurrentPreismeldung(currentPreismeldung)
                            )
                        )
                        .then(() => db)
                )
                .then(db =>
                    getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                        db,
                        P.pmsSortId(currentPreismeldung.preismeldung.pmsNummer),
                        { _id: P.pmsSortId(currentPreismeldung.preismeldung.pmsNummer), _rev: null, sortOrder: [] }
                    )
                        .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                            const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                                sortOrder: [
                                    ...pmsPreismeldungenSort.sortOrder.filter(
                                        x => x.sortierungsnummer < currentPreismeldung.sortierungsnummer
                                    ),
                                    {
                                        pmId: currentPreismeldung.pmId,
                                        sortierungsnummer: currentPreismeldung.sortierungsnummer,
                                    },
                                    ...pmsPreismeldungenSort.sortOrder
                                        .filter(x => x.sortierungsnummer >= currentPreismeldung.sortierungsnummer)
                                        .map(x => ({ pmId: x.pmId, sortierungsnummer: x.sortierungsnummer + 1 })),
                                ],
                            });
                            return db.put(newPmsPreismeldungsSort).then(() => db);
                        })
                        .then(() =>
                            // reread from db
                            db
                                .get(currentPreismeldung.preismeldung._id)
                                .then(res => ({ db, preismeldung: res }))
                                .then(x =>
                                    x.db.get(P.pmsSortId(currentPreismeldung.preismeldung.pmsNummer)).then(res => ({
                                        pmsPreismeldungenSort: res as P.Models.PmsPreismeldungenSort,
                                        preismeldung: x.preismeldung,
                                    }))
                                )
                        )
                )
        )
        .map(payload => ({ type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload }));

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

    @Effect()
    resetPreismeldung$ = this.actions$
        .ofType('RESET_PREISMELDUNG')
        .withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung
        )
        .filter(x => !!x.refPreismeldung)
        .flatMap(currentPreismeldung =>
            this.savePreismeldung(currentPreismeldung, [
                bag => copyPreismeldungPropertiesFromRefPreismeldung(bag.refPreismeldung),
            ])
        )
        .map(payload => ({ type: 'RESET_PREISMELDUNG_SUCCESS', payload }));

    @Effect()
    deletePreismeldung$ = this.actions$
        .ofType('RESET_PREISMELDUNG')
        .withLatestFrom(
            this.currentPreismeldung$,
            (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung
        )
        .filter(x => !x.refPreismeldung)
        .flatMap(bag =>
            getDatabase()
                .then(db =>
                    // Try to delete from local db, when none matching preismeldung was found, continue
                    db
                        .get(bag.preismeldung._id)
                        .then(doc => ({ db, doc }))
                        .then(x => x.db.remove(x.doc._id, x.doc._rev).then(() => x.db))
                        .catch(error => {
                            if (error.status !== 404) {
                                throw error;
                            }
                            return db;
                        })
                )
                .then(db =>
                    db
                        .get(P.pmsSortId(bag.preismeldung.pmsNummer))
                        .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                            const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                                sortOrder: pmsPreismeldungenSort.sortOrder.filter(x => x.pmId !== bag.pmId),
                            });
                            return db.put(newPmsPreismeldungsSort).then(() => db);
                        })
                        .then(() => bag.preismeldung._id)
                )
        )
        .map(payload => ({ type: 'DELETE_PREISMELDUNG_SUCCESS', payload }));

    preismeldungenSortSave = this.actions$
        .ofType('PREISMELDUNGEN_SORT_SAVE')
        .flatMap(({ payload }) => this.savePreismeldungenSort(payload))
        .subscribe();

    async savePreismeldung(
        currentPreismeldungBag: P.CurrentPreismeldungBag,
        copyFns: ((bag: P.CurrentPreismeldungBag) => any)[]
    ) {
        const db = await getDatabase();
        const doc = await db.get(currentPreismeldungBag.preismeldung._id);
        const copyObjects = copyFns.map(x => x(currentPreismeldungBag));
        await db.put(assign({}, doc, ...copyObjects));
        return await (db.get(currentPreismeldungBag.preismeldung._id) as Promise<P.Models.Preismeldung>);
    }

    savePreismeldungMessages(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [bag => messagesFromCurrentPreismeldung(bag)]);
    }

    savePreismeldungAttributes(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [bag => productMerkmaleFromCurrentPreismeldung(bag)]);
    }

    savePreismeldungPrice(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [
            bag => propertiesFromCurrentPreismeldung(bag),
            bag => messagesFromCurrentPreismeldung(bag),
        ]);
    }

    applySortierungen(currentPreismeldung: P.CurrentPreismeldungBag) {
        return this.preismeldungen$
            .take(1)
            .withLatestFrom(this.isInRecordMode$, (preismeldungen, isInRecordMode) => ({
                preismeldungen,
                isInRecordMode,
            }))
            .filter(({ isInRecordMode }) => isInRecordMode)
            .map(({ preismeldungen }) => {
                const currentIndex = preismeldungen.findIndex(pm => pm.pmId === currentPreismeldung.pmId);
                let newIndex = 0;
                sortBy(preismeldungen, pm => pm.sortierungsnummer).forEach((pm, i) => {
                    if (pm.sortierungsnummer === 0 || (!!pm.preismeldung.erfasstAt && i >= newIndex)) {
                        newIndex = i + 1;
                    }
                });
                if (currentIndex !== newIndex) {
                    const sortedPreismeldungen = sortBy(preismeldungen, pm => pm.sortierungsnummer);
                    const lastSortNumber = preismeldungen[newIndex - (newIndex === 0 ? 0 : 1)].sortierungsnummer;
                    return [
                        ...sortedPreismeldungen.slice(0, newIndex),
                        { ...currentPreismeldung, sortierungsnummer: lastSortNumber + (newIndex === 0 ? 0 : 1) },
                        ...sortedPreismeldungen.slice(newIndex),
                    ]
                        .filter((_, i) => i !== currentIndex + (currentIndex > newIndex ? 1 : 0))
                        .map((pm, i) => ({
                            ...pm,
                            sortierungsnummer:
                                i >= newIndex
                                    ? lastSortNumber +
                                      i -
                                      newIndex +
                                      (newIndex === 0 ? 0 : 1) +
                                      (currentIndex < newIndex ? 1 : 0)
                                    : pm.sortierungsnummer,
                        }));
                }
                return preismeldungen;
            })
            .flatMap(preismeldungen =>
                this.savePreismeldungenSort({
                    pmsNummer: currentPreismeldung.preismeldung.pmsNummer,
                    sortOrderDoc: {
                        sortOrder: preismeldungen.map(pm => ({
                            pmId: pm.pmId,
                            sortierungsnummer: pm.sortierungsnummer,
                        })),
                    },
                })
            );
    }

    savePreismeldungenSort(payload: { pmsNummer: string; sortOrderDoc: P.Models.PmsPreismeldungenSortProperties }) {
        return getDatabaseAsObservable()
            .map(db => ({ db, payload }))
            .flatMap(x =>
                x.db
                    .get(P.pmsSortId(x.payload.pmsNummer))
                    .then((dbDoc: P.Models.PmsPreismeldungenSort) => ({ dbDoc, payload: x.payload, db: x.db }))
            )
            .filter(x => !isEqual(x.dbDoc.sortOrder, x.payload.sortOrderDoc.sortOrder))
            .flatMap(x => x.db.put(assign({}, x.dbDoc, x.payload.sortOrderDoc)).then(() => x))
            .flatMap(x => x.db.get<P.Models.PmsPreismeldungenSort>(P.pmsSortId(x.payload.pmsNummer)));
    }
}
