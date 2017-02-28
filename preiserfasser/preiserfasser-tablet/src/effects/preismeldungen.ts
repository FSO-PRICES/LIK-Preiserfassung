import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as docuri from 'docuri';
import { format } from 'date-fns';

import { getDatabase, getAllDocumentsForPrefix } from './pouchdb-utils';
import * as fromRoot from '../reducers';
import * as P from '../common-models';

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
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`pm-ref/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, pmRefs: res.rows.map(y => y.doc) as P.Models.PreismeldungReference[] })))
        .flatMap(x => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => ({ db: x.db, pmsNummer: x.pmsNummer, refPreismeldungen: x.pmRefs, preismeldungen: res.rows.map(y => y.doc) as P.Models.Preismeldung[] })))
        .flatMap(x => {
            const missingPreismeldungs = x.refPreismeldungen
                .filter(rpm => !x.preismeldungen.find(pm => pm._id === rpm.pmId))
                .map<P.Models.Preismeldung>(rpm => ({
                    _id: preismeldungUri({ pmsNummer: rpm.pmsNummer, epNummer: rpm.epNummer, laufnummer: rpm.laufnummer }),
                    _rev: undefined,
                    pmId: rpm.pmId,
                    pmsNummer: rpm.pmsNummer,
                    epNummer: rpm.epNummer,
                    laufnummer: rpm.laufnummer,
                    preis: null,
                    menge: null,
                    preisNormal: null,
                    mengeNormal: null,
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
                .then(pms => x.db.allDocs(Object.assign({}, getAllDocumentsForPrefix(`pm/${x.pmsNummer}`), { include_docs: true })).then(res => res.rows.map(y => y.doc) as P.Models.Preismeldung[]))
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

    @Effect()
    savePreismeldung$ = this.actions$
        .ofType('SAVE_PREISMELDUNG_PRICE')
        .withLatestFrom(this.currentPreismeldung$, (action, currentPreismeldung: P.CurrentPreismeldungViewModel) => ({ currentPreismeldung, payload: action.payload }))
        .switchMap(({ currentPreismeldung, payload }) => {
            return getDatabase()
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(doc => ({ db, doc })))
                .then(({ db, doc }) => db.put(Object.assign({}, doc, {
                    artikeltext: currentPreismeldung.preismeldung.artikeltext,
                    artikelnummer: currentPreismeldung.preismeldung.artikelnummer,
                    aktion: currentPreismeldung.preismeldung.aktion,
                    internetLink: currentPreismeldung.preismeldung.internetLink,
                    preis: currentPreismeldung.preismeldung.preis,
                    menge: currentPreismeldung.preismeldung.menge,
                    bearbeitungscode: currentPreismeldung.preismeldung.bearbeitungscode,
                    preisVPNormalNeuerArtikel: currentPreismeldung.preismeldung.preisVPNormalNeuerArtikel,
                    mengeVPNormalNeuerArtikel: currentPreismeldung.preismeldung.mengeVPNormalNeuerArtikel,
                    percentageDPToLVP: currentPreismeldung.preismeldung.percentageDPToLVP,
                    percentageDPToVPNeuerArtikel: currentPreismeldung.preismeldung.percentageDPToVPNeuerArtikel,
                    percentageVPNeuerArtikelToVPAlterArtikel: currentPreismeldung.preismeldung.percentageVPNeuerArtikelToVPAlterArtikel,
                    istAbgebucht: true
                })).then(() => db))
                .then(db => db.get(currentPreismeldung.preismeldung._id).then(preismeldung => ({ preismeldung, saveAction: payload.saveAction })));
        })
        .map(payload => ({ type: 'SAVE_PREISMELDUNG_PRICE_SUCCESS', payload }));
}
