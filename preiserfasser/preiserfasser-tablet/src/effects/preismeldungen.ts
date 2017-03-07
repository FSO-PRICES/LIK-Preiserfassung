import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as docuri from 'docuri';
import { format } from 'date-fns';
import { assign } from 'lodash';

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
        .switchMap(({ payload }) => getDatabase().then(db => ({ db, pmsNummer: payload })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm-ref/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, pmRefs: res.rows.map(y => y.doc) as P.Models.PreismeldungReference[] })))
        .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.pmRefs, preismeldungen: res.rows.map(y => y.doc) as P.Models.Preismeldung[] })))
        // .flatMap(x => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm-sort/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.refPreismeldungen, preismeldungen: x.preismeldungen, sortPreismeldungen: res.rows.map(y => y.doc) as P.Models.Preismeldung[] })))
        .flatMap(x => {
            // Warning: the sorting only works when all the Preismeldungen for this Preismeldestelle are missing. New logic required if it happens that
            // new Preismeldungen start arriving!
            const missingPreismeldungs = x.refPreismeldungen
                .filter(rpm => !x.preismeldungen.find(pm => pm._id === rpm.pmId))
                .sort(preismeldungCompareFn)
                .map<P.Models.Preismeldung>((rpm, i) => ({
                    _id: preismeldungUri({ pmsNummer: rpm.pmsNummer, epNummer: rpm.epNummer, laufnummer: rpm.laufnummer }),
                    _rev: undefined,
                    pmsNummer: rpm.pmsNummer,
                    epNummer: rpm.epNummer,
                    laufnummer: rpm.laufnummer,
                    sortierungsnummer: i + 1,
                    preis: null,
                    menge: null,
                    preisVPNormalNeuerArtikel: null,
                    mengeVPNormalNeuerArtikel: null,
                    aktion: false,
                    artikelnummer: rpm.artikelnummer,
                    artikeltext: rpm.artikeltext,
                    bermerkungenAnsBfs: null,
                    modifiedAt: format(new Date()),
                    bearbeitungscode: 100,
                    uploadRequestedAt: null,
                    istAbgebucht: false,
                    percentageDPToLVP: null,
                    percentageDPToVPNeuerArtikel: null,
                    percentageVPNeuerArtikelToVPAlterArtikel: null,
                    internetLink: rpm.internetLink
                }));

            if (missingPreismeldungs.length === 0) {
                return Promise.resolve(x);
            }

            return x.db.bulkDocs(missingPreismeldungs)
                .then(pms => x.db.allDocs(assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => res.rows.map(y => y.doc) as P.Models.Preismeldung[]))
                .then(preismeldungen => ({
                    pmsNummer: x.pmsNummer,
                    db: x.db,
                    refPreismeldungen: x.refPreismeldungen,
                    preismeldungen
                }));
        })
        .flatMap(x => x.db.get(`pms/${x.pmsNummer}`).then((pms: P.Models.Preismeldestelle) => ({
            db: x.db,
            pms,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen
        })))
        .flatMap(x => x.db.get('warenkorb').then((warenkorbDoc: any) => ({ // TODO: add types for warenkorb
            pms: x.pms,
            warenkorbDoc,
            refPreismeldungen: x.refPreismeldungen,
            preismeldungen: x.preismeldungen
        })))
        // TODO: import action type
        .map(docs => ({ type: 'PREISMELDUNGEN_LOAD_SUCCESS', payload: docs }));

    savePreismeldungPrice = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungBag) => ({ currentPreismeldung, payload: action.payload }));

    @Effect()
    savePreismeldung$ = this.savePreismeldungPrice
        .filter(x => !x.currentPreismeldung.isNew)
        .switchMap(({ currentPreismeldung, payload }) => {
            return getDatabase()
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(doc => ({ db, doc })))
                .then(({ db, doc }) => db.put(assign({}, doc, this.propertiesFromCurrentPreismeldung(currentPreismeldung))).then(() => db))
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(preismeldung => ({ preismeldung, saveAction: payload.saveAction })));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));

    @Effect()
    saveNewPreismeldung$ = this.savePreismeldungPrice
        .filter(x => x.currentPreismeldung.isNew)
        .switchMap(({ currentPreismeldung, payload }) => {
            return getDatabase()
                .then(db => db.put(assign({}, {
                    _id: currentPreismeldung.pmId,
                    _rev: null,
                    epNummer: currentPreismeldung.preismeldung.epNummer,
                    laufnummer: currentPreismeldung.preismeldung.laufnummer,
                    pmsNummer: currentPreismeldung.preismeldung.pmsNummer
                }, this.propertiesFromCurrentPreismeldung(currentPreismeldung))).then(() => db))
        })
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
            percentageDPToLVP: currentPreismeldung.preismeldung.percentageDPToLVP,
            percentageDPToVPNeuerArtikel: currentPreismeldung.preismeldung.percentageDPToVPNeuerArtikel,
            percentageVPNeuerArtikelToVPAlterArtikel: currentPreismeldung.preismeldung.percentageVPNeuerArtikelToVPAlterArtikel,
            preis: currentPreismeldung.preismeldung.preis,
            preisVPNormalNeuerArtikel: currentPreismeldung.preismeldung.preisVPNormalNeuerArtikel,
        };
    }
}
