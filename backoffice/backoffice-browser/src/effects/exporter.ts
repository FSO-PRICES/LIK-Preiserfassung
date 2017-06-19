import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { assign, keyBy } from 'lodash';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { dbNames, getAllDocumentsForPrefixFromDb, getDatabaseAsObservable, getDocumentByKeyFromDb, getAllDocumentsFromDb } from './pouchdb-utils';
import { toCsv } from '../common/file-extensions';
import { preparePmsForExport, preparePreiserheberForExport, preparePmForExport } from '../common/presta-data-mapper';
import { continueEffectOnlyIfTrue, resetAndContinueWith, doAsyncAsObservable } from '../common/effects-extensions';
import { loadAllPreismeldestellen, loadAllPreismeldungen, loadAllPreiserheber } from '../common/user-db-values';
import { createEnvelope, MessageTypes } from '../common/envelope-extensions';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ExporterEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>) {
    }

    @Effect()
    exportPreismeldungen$ = this.actions$.ofType('EXPORT_PREISMELDUNGEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loadAllPreismeldungen()
            .map(preismeldungen => preismeldungen.filter(pm => pm.istAbgebucht))
            .flatMap(preismeldungen => {
                if (preismeldungen.length === 0) throw new Error('Keine abgebuchte preismeldungen vorhanden.');
                return getDatabaseAsObservable(dbNames.preismeldung) // Load erhebungsmonat from preismeldungen db
                    .flatMap(db => getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => erhebungsmonat))
                    .flatMap(erhebungsmonat =>
                        resetAndContinueWith({ type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action,
                            doAsyncAsObservable(() => {
                                const content = toCsv(preparePmForExport(preismeldungen, erhebungsmonat.monthAsString));
                                const count = preismeldungen.length;
                                const envelope = createEnvelope(MessageTypes.Preismeldungen);

                                FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);
                                FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pm_${envelope.fileSuffix}.csv`);

                                return { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count };
                            })
                        )
                    )
            })
            .catch(error => Observable.of({ type: 'EXPORT_PREISMELDUNGEN_FAILURE', payload: error.message } as exporter.Action))
        );

    @Effect()
    exportPreismeldestellen$ = this.actions$.ofType('EXPORT_PREISMELDESTELLEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loadAllPreismeldestellen()
            .flatMap(preismeldestellen => {
                if (preismeldestellen.length === 0) throw new Error('Keine preismeldestellen vorhanden.');
                return getDatabaseAsObservable(dbNames.preismeldestelle)
                    .flatMap(db => db.bulkDocs(preismeldestellen, { new_edits: false })) // new_edits: false -> enables the insertion of foreign docs
                    .flatMap(() => // retrieve all pms documents from 'master' preismeldestelle db with the assigned erhebungsmonat
                        getDatabaseAsObservable(dbNames.preismeldestelle)
                            .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, 'pms/')
                                .then(updatedPreismeldestellen => getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({ updatedPreismeldestellen, erhebungsmonat })))
                            )
                    )
                    .flatMap(({ updatedPreismeldestellen, erhebungsmonat }) =>
                        resetAndContinueWith({ type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                            doAsyncAsObservable(() => {
                                const content = toCsv(preparePmsForExport(updatedPreismeldestellen, erhebungsmonat.monthAsString));
                                const count = updatedPreismeldestellen.length;
                                const envelope = createEnvelope(MessageTypes.Preismeldestellen);

                                FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);
                                FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pms_${envelope.fileSuffix}.csv`);

                                return { type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count };
                            })
                        )
                    )
            })
            .catch(error => Observable.of({ type: 'EXPORT_PREISMELDESTELLEN_FAILURE', payload: error.message } as exporter.Action))
        );

    @Effect()
    exportPreiserheber$ = this.actions$.ofType('EXPORT_PREISERHEBER')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload }) => loadAllPreiserheber()
            .flatMap(preiserheber => {
                if (preiserheber.length === 0) throw new Error('Keine preiserheber erfasst.');
                return getDatabaseAsObservable(dbNames.preismeldung) // Load erhebungsmonat from preismeldungen db
                    .flatMap(db => getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({ erhebungsorgannummer: payload, erhebungsmonat })))
                    .flatMap(x => getPePreiszuweisungen(preiserheber).map(peZuweisungen => assign(x, { peZuweisungen })))
                    .flatMap(({ peZuweisungen, erhebungsmonat, erhebungsorgannummer }) =>
                        resetAndContinueWith({ type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action,
                            doAsyncAsObservable(() => {
                                const content = toCsv(preparePreiserheberForExport(peZuweisungen, erhebungsmonat.monthAsString, erhebungsorgannummer));
                                const count = peZuweisungen.length;
                                const envelope = createEnvelope(MessageTypes.Preiserheber);

                                FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);
                                FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pe_${envelope.fileSuffix}.csv`);

                                return { type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count };
                            })
                        )
                    )
            })
            .catch(error => Observable.of({ type: 'EXPORT_PREISERHEBER_FAILURE', payload: error.message } as exporter.Action))
        )
}

function getPePreiszuweisungen(preiserheber: P.Erheber[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisung)
        .flatMap(db => getAllDocumentsFromDb<P.Preiszuweisung>(db)
            .then(preiszuweisungen => {
                const zuweisungsMap = keyBy(preiszuweisungen, pz => pz.preiserheberId);
                return preiserheber.map(pe => assign({}, pe, { pmsNummers: zuweisungsMap[pe.username].preismeldestellenNummern }));
            })
        );
}
