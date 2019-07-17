import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { assign, flatMap as arrayFlatMap, isEqual, maxBy, sortBy } from 'lodash';
import { defer } from 'rxjs';
import {
    combineLatest,
    defaultIfEmpty,
    filter,
    flatMap,
    map,
    publishReplay,
    refCount,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import {
    copyPreismeldungPropertiesFromRefPreismeldung,
    createVorReduktionProperties,
    messagesFromCurrentPreismeldung,
    preismeldestelleId,
    PreismeldungAction,
    preismeldungCompareFn,
    productMerkmaleFromCurrentPreismeldung,
    propertiesFromCurrentPreismeldung,
    SavePreismeldungPriceSaveActionAktionType,
    SavePreismeldungPriceSaveActionCommentsType,
} from '@lik-shared';

import * as P from '../common-models';
import * as fromRoot from '../reducers';
import {
    getAllDocumentsForPrefixFromDb,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentWithFallback,
} from './pouchdb-utils';

@Injectable()
export class PreismeldungenEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    isInRecordMode$ = this.store.select(fromRoot.getPreismeldungenIsInRecordMode);
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    // TODO Fix types
    loadPreismeldungen$ = this.actions$.ofType('PREISMELDUNGEN_LOAD_FOR_PMS').pipe(
        flatMap((action: any) =>
            defer(async () => {
                const db = await getDatabase();
                return {
                    db,
                    refPreismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.PreismeldungReference>(
                        db,
                        P.preismeldungRefId(action.payload),
                    ),
                    preismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.Preismeldung>(
                        db,
                        P.preismeldungId(action.payload),
                    ),
                    pmsPreismeldungenSort: await getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                        db,
                        P.pmsSortId(action.payload),
                    ),
                };
            }).pipe(
                flatMap(async x => {
                    const missingPreismeldungs = x.refPreismeldungen
                        .filter(rpm => !x.preismeldungen.find(pm => pm._id === rpm.pmId))
                        .map(rpm => ({
                            _id: P.preismeldungId(rpm.pmsNummer, rpm.epNummer, rpm.laufnummer),
                            _rev: undefined,
                            ...copyPreismeldungPropertiesFromRefPreismeldung(rpm),
                        }));

                    const pmsPreismeldungenSort = x.pmsPreismeldungenSort || {
                        _id: P.pmsSortId(action.payload),
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
                        pmsNummer: action.payload,
                        db: x.db,
                        refPreismeldungen: x.refPreismeldungen,
                        preismeldungen: await getAllDocumentsForPrefixFromDb<P.Models.Preismeldung>(
                            x.db,
                            P.preismeldungId(action.payload),
                        ),
                        pmsPreismeldungenSort: await getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                            x.db,
                            P.pmsSortId(action.payload),
                        ),
                    };
                }),
                flatMap(async x => ({
                    ...x,
                    pms: await x.db.get<P.Models.Preismeldestelle>(preismeldestelleId(action.payload)),
                })),
                combineLatest(
                    this.store.select(fromRoot.getWarenkorb).pipe(
                        filter(x => !!x.length),
                        take(1),
                    ),
                    (x, warenkorb) => ({
                        isAdminApp: false,
                        pms: x.pms,
                        warenkorb,
                        refPreismeldungen: x.refPreismeldungen,
                        preismeldungen: x.preismeldungen,
                        pmsPreismeldungenSort: x.pmsPreismeldungenSort,
                        alreadyExported: [],
                    }),
                ),
                map(payload => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload } as PreismeldungAction)),
            ),
        ),
    );

    savePreismeldungPrice$ = this.actions$.ofType('SAVE_PREISMELDUNG_PRICE').pipe(
        // TODO Fix types
        withLatestFrom(this.currentPreismeldung$, (action: any, currentPreismeldung: P.CurrentPreismeldungBag) => ({
            currentPreismeldung,
            payload: action.payload,
        })),
        map(({ currentPreismeldung, payload }) => ({
            currentPreismeldung: {
                ...currentPreismeldung,
                preismeldung: {
                    ...currentPreismeldung.preismeldung,
                    ...createVorReduktionProperties(currentPreismeldung),
                    erfasstAt: +new Date(),
                },
            },
            payload,
        })),
        publishReplay(1),
        refCount(),
    );

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice$.pipe(
        filter(x => !x.currentPreismeldung.isNew),
        flatMap(x =>
            this.applySortierungen(x.currentPreismeldung).pipe(
                defaultIfEmpty(),
                map(sortierung => ({ ...x, sortierung })),
            ),
        ),
        flatMap(x => {
            const saveAction = x.payload as P.SavePreismeldungPriceSaveActionSave;
            let currentPreismeldung = x.currentPreismeldung;
            const kommentarAutotext = arrayFlatMap(
                saveAction.saveWithData
                    .filter(s => s.type === 'COMMENT')
                    .map((s: SavePreismeldungPriceSaveActionCommentsType) => s.comments),
            );
            const aktionAtions = saveAction.saveWithData.filter(
                x => x.type === 'AKTION',
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
                setAktion,
            );
            return this.savePreismeldungPrice(currentPreismeldung).then(preismeldung => ({
                preismeldung,
                sortierung: x.sortierung,
                saveAction,
            }));
        }),
        map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload })),
    );

    @Effect()
    saveNewPreismeldung$ = this.savePreismeldungPrice$.pipe(
        filter(x => x.currentPreismeldung.isNew),
        flatMap(({ currentPreismeldung }) =>
            getDatabase()
                .then((
                    db, // save Preismeldung
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
                                productMerkmaleFromCurrentPreismeldung(currentPreismeldung),
                            ),
                        )
                        .then(() => db),
                )
                .then(db =>
                    getDocumentWithFallback<P.Models.PmsPreismeldungenSort>(
                        db,
                        P.pmsSortId(currentPreismeldung.preismeldung.pmsNummer),
                        { _id: P.pmsSortId(currentPreismeldung.preismeldung.pmsNummer), _rev: null, sortOrder: [] },
                    )
                        .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                            const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                                sortOrder: [
                                    ...pmsPreismeldungenSort.sortOrder.filter(
                                        x => x.sortierungsnummer < currentPreismeldung.sortierungsnummer,
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
                                    })),
                                ),
                        ),
                ),
        ),
        map(payload => ({ type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload })),
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
                        }),
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
                        .then(() => bag.preismeldung._id),
                ),
        ),
        map(payload => ({ type: 'DELETE_PREISMELDUNG_SUCCESS', payload })),
    );

    preismeldungenSortSave = this.actions$
        .ofType('PREISMELDUNGEN_SORT_SAVE')
        .pipe(flatMap((action: any) => this.savePreismeldungenSort(action.payload)))
        .subscribe();

    savePreismeldung(
        currentPreismeldungBag: P.CurrentPreismeldungBag,
        copyFns: ((bag: P.CurrentPreismeldungBag) => any)[],
    ) {
        return getDatabase()
            .then(db => db.get(currentPreismeldungBag.preismeldung._id).then(doc => ({ db, doc })))
            .then(({ db, doc }) => {
                const copyObjects = copyFns.map(x => x(currentPreismeldungBag));
                return db.put(assign({}, doc, ...copyObjects)).then(() => db);
            })
            .then(db => db.get(currentPreismeldungBag.preismeldung._id) as Promise<P.Models.Preismeldung>);
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
        return this.preismeldungen$.pipe(
            take(1),
            withLatestFrom(this.isInRecordMode$, (preismeldungen, isInRecordMode) => ({
                preismeldungen,
                isInRecordMode,
            })),
            filter(({ isInRecordMode }) => isInRecordMode),
            map(({ preismeldungen }) => {
                const lastSortierungsnummer = maxBy(preismeldungen, x =>
                    !!x.preismeldung.erfasstAt ? x.sortierungsnummer : 0,
                ).sortierungsnummer;
                const currentIndex = preismeldungen.findIndex(pm => pm.pmId === currentPreismeldung.pmId);
                const newIndex = preismeldungen.some(x => !!x.preismeldung.erfasstAt)
                    ? preismeldungen.findIndex(pm => pm.sortierungsnummer === lastSortierungsnummer)
                    : -1;
                if (currentIndex !== newIndex) {
                    const sortedPreismeldungen = sortBy(preismeldungen, pm => pm.sortierungsnummer);
                    return [
                        ...sortedPreismeldungen.slice(0, newIndex + 1),
                        currentPreismeldung,
                        ...sortedPreismeldungen.slice(newIndex + 1),
                    ]
                        .filter((_, i) => i !== currentIndex + (currentIndex > newIndex ? 1 : 0))
                        .map((pm, i) => ({ ...pm, sortierungsnummer: i + 1 }));
                }
                return preismeldungen;
            }),
            flatMap(preismeldungen =>
                this.savePreismeldungenSort({
                    pmsNummer: currentPreismeldung.preismeldung.pmsNummer,
                    sortOrderDoc: {
                        sortOrder: preismeldungen.map(pm => ({
                            pmId: pm.pmId,
                            sortierungsnummer: pm.sortierungsnummer,
                        })),
                    },
                }),
            ),
        );
    }

    savePreismeldungenSort(payload: { pmsNummer: string; sortOrderDoc: P.Models.PmsPreismeldungenSortProperties }) {
        return getDatabaseAsObservable().pipe(
            map(db => ({ db, payload })),
            flatMap(x =>
                x.db
                    .get(P.pmsSortId(x.payload.pmsNummer))
                    .then((dbDoc: P.Models.PmsPreismeldungenSort) => ({ dbDoc, payload: x.payload, db: x.db })),
            ),
            filter(x => !isEqual(x.dbDoc.sortOrder, x.payload.sortOrderDoc.sortOrder)),
            flatMap(x => x.db.put(assign({}, x.dbDoc, x.payload.sortOrderDoc)).then(() => x)),
            flatMap(x => x.db.get<P.Models.PmsPreismeldungenSort>(P.pmsSortId(x.payload.pmsNummer))),
        );
    }
}
