import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as docuri from 'docuri';
import { format } from 'date-fns';
import { assign, keys } from 'lodash';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';
import { preismeldungCompareFn } from 'lik-shared';

const preismeldungUri = docuri.route(P.Models.preismeldungUriRoute);
const pmsPreismeldungenSortUri = docuri.route(P.Models.pmsPreismeldungenSortUriRoute);

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
                    preis: null,
                    menge: null,
                    preisVPNormalNeuerArtikel: null,
                    mengeVPNormalNeuerArtikel: null,
                    fehlendePreiseR: '',
                    aktion: false,
                    artikelnummer: rpm.artikelnummer,
                    artikeltext: rpm.artikeltext,
                    bermerkungenAnsBfs: null,
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

            return x.db.bulkDocs((missingPreismeldungs as any[]).concat([ newPmsPreismeldungenSort ]))
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

    savePreismeldungPrice = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({ currentPreismeldung, payload: action.payload }));

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice
        .filter(x => !x.currentPreismeldung.isNew)
        .flatMap(({ currentPreismeldung, payload }) => {
            return getDatabase()
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(doc => ({ db, doc })))
                .then(({ db, doc }) => db.put(assign({}, doc, this.propertiesFromCurrentPreismeldung(currentPreismeldung))).then(() => db))
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(preismeldung => ({ preismeldung, saveAction: payload })));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    saveNewPreismeldung$ = this.savePreismeldungPrice
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
                    }, this.propertiesFromCurrentPreismeldung(currentPreismeldung))).then(() => db)
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

    propertiesFromCurrentPreismeldung(currentPreismeldung: P.CurrentPreismeldungBag) {
        return {
            aktion: currentPreismeldung.preismeldung.aktion,
            artikelnummer: currentPreismeldung.preismeldung.artikelnummer,
            artikeltext: currentPreismeldung.preismeldung.artikeltext,
            bearbeitungscode: currentPreismeldung.preismeldung.bearbeitungscode,
            bermerkungenAnsBfs: currentPreismeldung.preismeldung.bermerkungenAnsBfs,
            internetLink: currentPreismeldung.preismeldung.internetLink,
            istAbgebucht: true,
            menge: currentPreismeldung.preismeldung.menge,
            mengeVPNormalNeuerArtikel: currentPreismeldung.preismeldung.mengeVPNormalNeuerArtikel,
            modifiedAt: new Date(),
            percentageDPToVP: currentPreismeldung.preismeldung.percentageDPToVP,
            percentageDPToVPVorReduktion: currentPreismeldung.preismeldung.percentageDPToVPVorReduktion,
            percentageDPToVPNeuerArtikel: currentPreismeldung.preismeldung.percentageDPToVPNeuerArtikel,
            percentageVPNeuerArtikelToVPAlterArtikel: currentPreismeldung.preismeldung.percentageVPNeuerArtikelToVPAlterArtikel,
            preis: currentPreismeldung.preismeldung.preis,
            preisVPNormalNeuerArtikel: currentPreismeldung.preismeldung.preisVPNormalNeuerArtikel,
            fehlendePreiseR: currentPreismeldung.preismeldung.fehlendePreiseR,
        };
    }
}
