import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as docuri from 'docuri';
import { format } from 'date-fns';
import { assign, cloneDeep, remove } from 'lodash';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';
import { preismeldungCompareFn } from 'lik-shared';

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
                .map<P.Models.Preismeldung>(rpm => ({
                    _id: preismeldungUri({ pmsNummer: rpm.pmsNummer, epNummer: rpm.epNummer, laufnummer: rpm.laufnummer }),
                    _rev: undefined,
                    pmsNummer: rpm.pmsNummer,
                    epNummer: rpm.epNummer,
                    laufnummer: rpm.laufnummer,
                    preis: '',
                    menge: '',
                    preisVPNormalNeuerArtikel: '',
                    mengeVPNormalNeuerArtikel: '',
                    fehlendePreiseR: '',
                    aktion: false,
                    artikelnummer: rpm.artikelnummer,
                    artikeltext: rpm.artikeltext,
                    bemerkungen: rpm.bemerkungen,
                    notiz: rpm.notiz,
                    kommentar: '\\n',
                    productMerkmale: rpm.productMerkmale,
                    modifiedAt: format(new Date()),
                    bearbeitungscode: 99,
                    uploadRequestedAt: null,
                    istAbgebucht: false,
                    percentageDPToVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                    internetLink: rpm.internetLink
                }));

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
        .withLatestFrom(this.store.select(fromRoot.getWarenkorb), (x, warenkorb) => ({
            pms: x.pms,
            warenkorb,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen,
            pmsPreismeldungenSort: x.pmsPreismeldungenSort
        }))
        .map(payload => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload }));

    savePreismeldungPrice$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({ currentPreismeldung, payload: action.payload }));

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice$
        .filter(x => !x.currentPreismeldung.isNew)
        .flatMap(x => {
            const saveAction = x.payload as P.SavePreismeldungPriceSaveAction;
            let currentPreismeldung = x.currentPreismeldung;
            if (saveAction.saveWithData === 'COMMENT') {
                currentPreismeldung = assign({}, x.currentPreismeldung, { messages: assign({}, x.currentPreismeldung.messages, { kommentarAutotext: saveAction.data }) });
            }
            if (saveAction.saveWithData === 'AKTION') {
                currentPreismeldung = assign({}, x.currentPreismeldung, { preismeldung: assign({}, x.currentPreismeldung.preismeldung, { aktion: saveAction.data }) }, { messages: assign({}, x.currentPreismeldung.messages, { kommentarAutotext: '' }) });
            }
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
        .flatMap(currentPreismeldung =>
            this.savePreismeldung(currentPreismeldung, [
                bag => ({
                    preis: '',
                    menge: '',
                    preisVPNormalNeuerArtikel: '',
                    mengeVPNormalNeuerArtikel: '',
                    bearbeitungscode: 99,
                    aktion: false,
                    artikelnummer: bag.refPreismeldung.artikelnummer,
                    artikeltext: bag.refPreismeldung.artikeltext,
                    bemerkungen: bag.refPreismeldung.bemerkungen,
                    notiz: bag.refPreismeldung.notiz,
                    kommentar: '\\n',
                    productMerkmale: bag.refPreismeldung.productMerkmale,
                    internetLink: bag.refPreismeldung.internetLink,
                    percentageDPToVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                })
            ])
        )
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
        internetLink: bag.preismeldung.internetLink,
        istAbgebucht: true,
        menge: bag.preismeldung.menge,
        mengeVPNormalNeuerArtikel: bag.preismeldung.mengeVPNormalNeuerArtikel,
        modifiedAt: format(new Date()),
        percentageDPToVP: bag.preismeldung.percentageDPToVP,
        percentageDPToVPVorReduktion: bag.preismeldung.percentageDPToVPVorReduktion,
        percentageDPToVPNeuerArtikel: bag.preismeldung.percentageDPToVPNeuerArtikel,
        percentageVPNeuerArtikelToVPAlterArtikel: bag.preismeldung.percentageVPNeuerArtikelToVPAlterArtikel,
        preis: bag.preismeldung.preis,
        preisVPNormalNeuerArtikel: bag.preismeldung.preisVPNormalNeuerArtikel,
        fehlendePreiseR: bag.preismeldung.fehlendePreiseR
    })

    messagesFromCurrentPreismeldung = (bag: P.CurrentPreismeldungBag) => ({
        notiz: bag.messages.notiz,
        kommentar: bag.messages.kommentarAutotext + (!!bag.messages.kommentarAutotext ? '\\n' : '') + bag.messages.kommentar,
        bemerkungen: bag.messages.bemerkungenHistory + '\\nPE:' + bag.messages.bemerkungen,
        modifiedAt: format(new Date()),
    })

    productMerkmaleFromCurrentPreismeldung = (bag: P.CurrentPreismeldungBag) => ({
        productMerkmale: cloneDeep(bag.attributes),
        modifiedAt: format(new Date())
    })
}
