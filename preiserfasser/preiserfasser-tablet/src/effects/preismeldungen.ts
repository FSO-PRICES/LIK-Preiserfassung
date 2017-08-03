import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as docuri from 'docuri';
import { format, startOfMonth } from 'date-fns';
import { assign, cloneDeep, flatMap, isEqual } from 'lodash';

import { getDatabase, getAllDocumentsForPrefix, getDatabaseAsObservable } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';
import { preismeldungCompareFn } from 'lik-shared';
import { SavePreismeldungPriceSaveActionCommentsType, SavePreismeldungPriceSaveActionAktionType } from '../actions/preismeldungen';

const preismeldungUri = docuri.route(P.Models.preismeldungUriRoute);

@Injectable()
export class PreismeldungenEffects {
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    loadPreismeldungen$ = this.actions$
        .ofType('PREISMELDUNGEN_LOAD_FOR_PMS')
        .flatMap(({ payload }) => getDatabase().then(db => ({ db, pmsNummer: payload })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm-ref/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, pmRefs: res.rows.map(y => y.doc) as P.Models.PreismeldungReference[] })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.pmRefs, preismeldungen: res.rows.map(y => y.doc) as P.Models.Preismeldung[] })))
        .flatMap(x => x.db.get(`pms-sort/${x.pmsNummer}`).catch(err => null).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.refPreismeldungen, preismeldungen: x.preismeldungen, pmsPreismeldungenSort: res as P.Models.PmsPreismeldungenSort })))
        .flatMap(x => {
            // Warning: the sorting only works when all the Preismeldungen for this Preismeldestelle are missing. New logic required if it happens that
            // new Preismeldungen start arriving!
            const missingPreismeldungs = x.refPreismeldungen
                .filter(rpm => !x.preismeldungen.find(pm => pm._id === rpm.pmId))
                .map(rpm =>
                    assign({}, {
                        _id: preismeldungUri({ pmsNummer: rpm.pmsNummer, epNummer: rpm.epNummer, laufnummer: rpm.laufnummer }),
                        _rev: undefined,
                    }, this.copyPreismeldungPropertiesFromRefPreismeldung(rpm)));

            const pmsPreismeldungenSort = x.pmsPreismeldungenSort || { _id: `pms-sort/${x.pmsNummer}`, _rev: null };

            if (missingPreismeldungs.length === 0) {
                return Promise.resolve(x);
            }

            const newPmsPreismeldungenSort = assign({}, pmsPreismeldungenSort, {
                sortOrder: x.refPreismeldungen
                    .filter(rpm => !pmsPreismeldungenSort[rpm.pmId])
                    .sort(preismeldungCompareFn)
                    .map((rpm, i) => ({ pmId: rpm.pmId, sortierungsnummer: i + 1 }))
            });

            return x.db.bulkDocs((missingPreismeldungs as any[]).concat([newPmsPreismeldungenSort]))
                .then(() => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => res.rows.map(y => y.doc) as P.Models.Preismeldung[]))
                .then(preismeldungen => x.db.get(`pms-sort/${x.pmsNummer}`).then(res => ({ preismeldungen, pmsPreismeldungenSort: res as P.Models.PmsPreismeldungenSort })))
                .then(y => ({
                    pmsNummer: x.pmsNummer,
                    db: x.db,
                    refPreismeldungen: x.refPreismeldungen,
                    preismeldungen: y.preismeldungen,
                    pmsPreismeldungenSort: y.pmsPreismeldungenSort
                }));
        })
        .flatMap(x => x.db.get(`pms/${x.pmsNummer}`).then((pms: P.Models.Preismeldestelle) => ({
            db: x.db,
            pms,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen,
            pmsPreismeldungenSort: x.pmsPreismeldungenSort
        })))
        .combineLatest(this.store.select(fromRoot.getWarenkorb).filter(x => !!x.length).take(1), (x, warenkorb) => ({
            pms: x.pms,
            warenkorb,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen,
            pmsPreismeldungenSort: x.pmsPreismeldungenSort
        }))
        .map(payload => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload }));

    savePreismeldungPrice$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({ currentPreismeldung, payload: action.payload }))
        .map(({ currentPreismeldung, payload }) => ({ currentPreismeldung: assign({}, currentPreismeldung, { preismeldung: assign({}, currentPreismeldung.preismeldung, this.createVorReduktionProperties(currentPreismeldung)) }), payload }));

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice$
        .filter(x => !x.currentPreismeldung.isNew)
        .flatMap(x => {
            const saveAction = x.payload as P.SavePreismeldungPriceSaveActionSave;
            let currentPreismeldung = x.currentPreismeldung;
            const kommentarAutotext = flatMap<string[][], string>(saveAction.saveWithData.filter(x => x.type === 'COMMENT').map((x: SavePreismeldungPriceSaveActionCommentsType) => x.comments));
            const aktionAtions = saveAction.saveWithData.filter(x => x.type === 'AKTION') as SavePreismeldungPriceSaveActionAktionType[];
            if (aktionAtions.length > 1) {
                throw new Error(`More than one AKTION: ${JSON.stringify(saveAction)}`);
            }
            const setAktion = aktionAtions.length === 1 ? { preismeldung: assign({}, x.currentPreismeldung.preismeldung, { aktion: aktionAtions[0].value }) } : null;
            currentPreismeldung = assign({}, x.currentPreismeldung, { messages: assign({}, x.currentPreismeldung.messages, { kommentarAutotext }) }, setAktion);
            return this.savePreismeldungPrice(currentPreismeldung)
                .then(preismeldung => ({ preismeldung, saveAction }));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    saveNewPreismeldung$ = this.savePreismeldungPrice$
        .filter(x => x.currentPreismeldung.isNew)
        .flatMap(({ currentPreismeldung }) =>
            getDatabase()
                .then(db => // save Preismeldung
                    db.put(assign({}, {
                        _id: currentPreismeldung.preismeldung._id,
                        _rev: null,
                        epNummer: currentPreismeldung.preismeldung.epNummer,
                        laufnummer: currentPreismeldung.preismeldung.laufnummer,
                        pmsNummer: currentPreismeldung.preismeldung.pmsNummer
                    }, this.propertiesFromCurrentPreismeldung(currentPreismeldung), this.messagesFromCurrentPreismeldung(currentPreismeldung), this.productMerkmaleFromCurrentPreismeldung(currentPreismeldung))).then(() => db)
                )
                .then(db =>
                    db.get(`pms-sort/${currentPreismeldung.preismeldung.pmsNummer}`)
                        .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                            const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                                sortOrder: [
                                    ...pmsPreismeldungenSort.sortOrder.filter(x => x.sortierungsnummer < currentPreismeldung.sortierungsnummer),
                                    { pmId: currentPreismeldung.pmId, sortierungsnummer: currentPreismeldung.sortierungsnummer },
                                    ...pmsPreismeldungenSort.sortOrder.filter(x => x.sortierungsnummer >= currentPreismeldung.sortierungsnummer).map(x => ({ pmId: x.pmId, sortierungsnummer: x.sortierungsnummer + 1 }))
                                ]
                            });
                            return db.put(newPmsPreismeldungsSort).then(() => db);
                        })
                        .then(() => // reread from db
                            db.get(currentPreismeldung.preismeldung._id).then(res => ({ db, preismeldung: res }))
                                .then(x => x.db.get(`pms-sort/${currentPreismeldung.preismeldung.pmsNummer}`).then(res => ({ pmsPreismeldungenSort: res as P.Models.PmsPreismeldungenSort, preismeldung: x.preismeldung }))))
                )
        )
        .map(payload => ({ type: 'SAVE_NEW_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    savePreismeldungMessages$ = this.actions$
        .ofType('SAVE_PREISMELDING_MESSAGES')
        .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung)
        .flatMap(currentPreismeldung => this.savePreismeldungMessages(currentPreismeldung))
        .map(payload => ({ type: 'SAVE_PREISMELDING_MESSAGES_SUCCESS', payload }));

    @Effect()
    savePreismeldungAttributes$ = this.actions$
        .ofType('SAVE_PREISMELDING_ATTRIBUTES')
        .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung)
        .flatMap(currentPreismeldung => this.savePreismeldungAttributes(currentPreismeldung))
        .map(payload => ({ type: 'SAVE_PREISMELDING_ATTRIBUTES_SUCCESS', payload }));

    @Effect()
    resetPreismeldung$ = this.actions$
        .ofType('RESET_PREISMELDUNG')
        .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung)
        .filter(x => !!x.refPreismeldung)
        .flatMap(currentPreismeldung => this.savePreismeldung(currentPreismeldung, [bag => this.copyPreismeldungPropertiesFromRefPreismeldung(bag.refPreismeldung)]))
        .map(payload => ({ type: 'RESET_PREISMELDUNG_SUCCESS', payload }));

    @Effect()
    deletePreismeldung$ = this.actions$
        .ofType('RESET_PREISMELDUNG')
        .withLatestFrom(this.currentPreismeldung$, (_, currentPreismeldung: P.CurrentPreismeldungBag) => currentPreismeldung)
        .filter(x => !x.refPreismeldung)
        .flatMap(bag => getDatabase()
            .then(db => db.get(bag.preismeldung._id).then(doc => ({ db, doc })))
            .then(x => x.db.remove(x.doc._id, x.doc._rev).then(() => x.db))
            .then(db => db.get(`pms-sort/${bag.preismeldung.pmsNummer}`)
                .then((pmsPreismeldungenSort: P.Models.PmsPreismeldungenSort) => {
                    const newPmsPreismeldungsSort = assign({}, pmsPreismeldungenSort, {
                        sortOrder: pmsPreismeldungenSort.sortOrder.filter(x => x.pmId !== bag.pmId)
                    });
                    return db.put(newPmsPreismeldungsSort).then(() => db);
                })
                .then(() => bag.preismeldung._id)
            ))
        .map(payload => ({ type: 'DELETE_PREISMELDUNG_SUCCESS', payload }));

    preismeldungenSortSave = this.actions$
        .ofType('PREISMELDUNGEN_SORT_SAVE')
        .flatMap(({ payload }) => getDatabaseAsObservable().map(db => ({ db, payload })))
        .flatMap(x => x.db.get(`pms-sort/${x.payload.pmsNummer}`).then((dbDoc: P.Models.PmsPreismeldungenSort) => ({ dbDoc, payload: x.payload, db: x.db })))
        .filter(x => !isEqual(x.dbDoc.sortOrder, x.payload.sortOrderDoc.sortOrder))
        .flatMap(x => x.db.put(assign({}, x.dbDoc, x.payload.sortOrderDoc)))
        .subscribe();

    savePreismeldung(currentPreismeldungBag: P.CurrentPreismeldungBag, copyFns: ((bag: P.CurrentPreismeldungBag) => any)[]) {
        return getDatabase()
            .then(db => db.get(currentPreismeldungBag.preismeldung._id).then(doc => ({ db, doc })))
            .then(({ db, doc }) => {
                const copyObjects = copyFns.map(x => x(currentPreismeldungBag));
                return db.put(assign({}, doc, ...copyObjects)).then(() => db);
            })
            .then(db => db.get(currentPreismeldungBag.preismeldung._id) as Promise<P.Models.Preismeldung>);
    }

    savePreismeldungMessages(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [
            bag => this.messagesFromCurrentPreismeldung(bag)
        ]);
    }

    savePreismeldungAttributes(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [
            bag => this.productMerkmaleFromCurrentPreismeldung(bag)
        ]);
    }

    savePreismeldungPrice(currentPreismeldungBag: P.CurrentPreismeldungBag) {
        return this.savePreismeldung(currentPreismeldungBag, [
            bag => this.propertiesFromCurrentPreismeldung(bag),
            bag => this.messagesFromCurrentPreismeldung(bag)
        ]);
    }

    propertiesFromCurrentPreismeldung = (bag: P.CurrentPreismeldungBag) => ({
        aktion: bag.preismeldung.aktion,
        artikelnummer: bag.preismeldung.artikelnummer,
        artikeltext: bag.preismeldung.artikeltext,
        bearbeitungscode: bag.preismeldung.bearbeitungscode,
        erhebungsZeitpunkt: bag.preismeldung.erhebungsZeitpunkt,
        internetLink: bag.preismeldung.internetLink,
        istAbgebucht: true,
        menge: bag.preismeldung.menge,
        mengeVPK: bag.preismeldung.mengeVPK,
        mengeVorReduktion: bag.preismeldung.mengeVorReduktion,
        modifiedAt: format(new Date()),
        d_DPToVP: bag.preismeldung.d_DPToVP,
        d_DPToVPVorReduktion: bag.preismeldung.d_DPToVPVorReduktion,
        d_DPToVPK: bag.preismeldung.d_DPToVPK,
        d_VPKToVPAlterArtikel: bag.preismeldung.d_VPKToVPAlterArtikel,
        d_VPKToVPVorReduktion: bag.preismeldung.d_VPKToVPVorReduktion,
        d_DPVorReduktionToVPVorReduktion: bag.preismeldung.d_DPVorReduktionToVPVorReduktion,
        d_DPVorReduktionToVP: bag.preismeldung.d_DPVorReduktionToVP,
        preis: bag.preismeldung.preis,
        preisVPK: bag.preismeldung.preisVPK,
        preisVorReduktion: bag.preismeldung.preisVorReduktion,
        fehlendePreiseR: bag.preismeldung.fehlendePreiseR,
        datumVorReduktion: bag.preismeldung.datumVorReduktion
    })

    messagesFromCurrentPreismeldung = (bag: P.CurrentPreismeldungBag) => ({
        notiz: bag.messages.notiz,
        kommentar: bag.messages.kommentarAutotext.join(',') + (bag.messages.kommentarAutotext.length > 0 ? '\\n' : '') + bag.messages.kommentar,
        bemerkungen: bag.messages.bemerkungenHistory + (!!bag.messages.bemerkungenHistory ? '\\n' : '') + (!!bag.messages.bemerkungen ? 'PE:' + bag.messages.bemerkungen : ''),
        modifiedAt: format(new Date()),
    })

    productMerkmaleFromCurrentPreismeldung = (bag: P.CurrentPreismeldungBag) => ({
        productMerkmale: cloneDeep(bag.attributes),
        modifiedAt: format(new Date())
    })

    createInitialPercentageWithWarning(): P.Models.PercentageWithWarning {
        return { percentage: null, warning: false, textzeil: null };
    }

    createVorReduktionProperties(bag: P.PreismeldungBag): { preisVorReduktion: string; mengeVorReduktion: string; datumVorReduktion: string } {
        let preisVorReduktion, mengeVorReduktion, datumVorReduktion;
        const today = format(new Date(), 'DD.MM.YYYY');
        const firstDayOfMonth = format(startOfMonth(new Date()), 'DD.MM.YYYY');

        if (!bag.preismeldung.aktion) {
            preisVorReduktion = bag.preismeldung.preis;
            mengeVorReduktion = bag.preismeldung.menge;
            datumVorReduktion = today;
        } else {
            switch (bag.preismeldung.bearbeitungscode) {
                case 99: {
                    preisVorReduktion = `${bag.refPreismeldung.preisVorReduktion}`
                    mengeVorReduktion = `${bag.refPreismeldung.mengeVorReduktion}`;
                    datumVorReduktion = `${bag.refPreismeldung.datumVorReduktion}`;
                    break;
                }
                case 2:
                case 7: {
                    preisVorReduktion = bag.preismeldung.preisVPK;
                    mengeVorReduktion = bag.preismeldung.mengeVPK;
                    datumVorReduktion = firstDayOfMonth;
                    break;
                }
                case 1: {
                    preisVorReduktion = bag.preismeldung.preisVorReduktion;
                    mengeVorReduktion = bag.preismeldung.mengeVorReduktion;
                    datumVorReduktion = today;
                    break;
                }
            }
        }

        return {
            preisVorReduktion,
            mengeVorReduktion,
            datumVorReduktion
        };
    }

    copyPreismeldungPropertiesFromRefPreismeldung(rpm: P.Models.PreismeldungReference) {
        return {
            pmsNummer: rpm.pmsNummer,
            epNummer: rpm.epNummer,
            laufnummer: rpm.laufnummer,
            preis: '',
            menge: '',
            preisVPK: '',
            mengeVPK: '',
            fehlendePreiseR: '',
            preisVorReduktion: '',
            mengeVorReduktion: '',
            datumVorReduktion: '',
            aktion: false,
            artikelnummer: rpm.artikelnummer,
            artikeltext: rpm.artikeltext,
            bemerkungen: rpm.bemerkungen,
            notiz: rpm.notiz,
            erhebungsZeitpunkt: rpm.erhebungsZeitpunkt,
            kommentar: '\\n',
            productMerkmale: rpm.productMerkmale,
            modifiedAt: format(new Date()),
            bearbeitungscode: 99,
            uploadRequestedAt: null,
            istAbgebucht: false,
            d_DPToVP: this.createInitialPercentageWithWarning(),
            d_DPToVPVorReduktion: this.createInitialPercentageWithWarning(),
            d_DPToVPK: this.createInitialPercentageWithWarning(),
            d_VPKToVPAlterArtikel: this.createInitialPercentageWithWarning(),
            d_VPKToVPVorReduktion: this.createInitialPercentageWithWarning(),
            d_DPVorReduktionToVPVorReduktion: this.createInitialPercentageWithWarning(),
            d_DPVorReduktionToVP: this.createInitialPercentageWithWarning(),
            internetLink: rpm.internetLink
        };
    }
}
