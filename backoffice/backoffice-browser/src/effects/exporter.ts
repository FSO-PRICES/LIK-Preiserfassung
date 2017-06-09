import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import * as FileSaver from 'file-saver';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { getAllDocumentsForPrefixFromDb, dbNames, getDatabaseAsObservable, getDocumentByKeyFromDb } from './pouchdb-utils';
import { toCsv } from '../common/file-extensions';
import { preparePmsForExport, preparePreiserheberForExport, preparePmForExport } from '../common/presta-data-mapper';
import { continueEffectOnlyIfTrue, resetAndContinueWith, doAsyncAsObservable } from '../common/effects-extensions';
import { loadAllPreismeldestellen, loadAllPreismeldungen } from '../common/user-db-values';
import { createEnvelope, MessageTypes } from '../common/envelope-extensions';


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
        .flatMap(() => loadAllPreismeldungen())
        .flatMap(preismeldungen => // retrieve the assigned erhebungsmonat
            getDatabaseAsObservable(dbNames.preismeldung)
                .flatMap(db => getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({ preismeldungen, erhebungsmonat })))
        )
        .flatMap(({ preismeldungen, erhebungsmonat }) => // export to csv
            resetAndContinueWith({ type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action,
                doAsyncAsObservable(() => {
                    const content = toCsv(preparePmForExport(preismeldungen, erhebungsmonat.monthAsString));
                    const count = preismeldungen.length;
                    const envelope = createEnvelope(MessageTypes.Preismeldungen);

                    FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);  // TODO: Add envelope content
                    FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pm_${envelope.fileSuffix}.csv`);

                    return { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count };
                })
            )
        );

    @Effect()
    exportPreismeldestellen$ = this.actions$.ofType('EXPORT_PREISMELDESTELLEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => loadAllPreismeldestellen())
        .flatMap(preismeldestellen => // write updated pms documents back to 'master' preismeldestelle db
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => db.bulkDocs(preismeldestellen, { new_edits: false })) // new_edits: false -> enables the insertion of foreign docs
        )
        .flatMap(() => // retrieve all pms documents from 'master' preismeldestelle db with the assigned erhebungsmonat
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, 'pms/')
                    .then(preismeldestellen => getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({ preismeldestellen, erhebungsmonat })))
                )
        )
        .flatMap(({ preismeldestellen, erhebungsmonat }) => // export to csv
            resetAndContinueWith({ type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                doAsyncAsObservable(() => {
                    const content = toCsv(preparePmsForExport(preismeldestellen, erhebungsmonat.monthAsString));
                    const count = preismeldestellen.length;
                    const envelope = createEnvelope(MessageTypes.Preismeldestellen);

                    FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);  // TODO: Add envelope content
                    FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pm_${envelope.fileSuffix}.csv`);

                    return { type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count };
                })
            )
        );

    @Effect()
    exportPreiserheber$ = this.actions$.ofType('EXPORT_PREISERHEBER')
        .flatMap(({ payload }) =>
            Observable.of({ type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action)
                .merge(Observable.create((observer: Observer<exporter.Action>) => {
                    setTimeout(() => {
                        const content = toCsv(preparePreiserheberForExport(payload));
                        const count = payload.length;
                        const envelope = createEnvelope(MessageTypes.Preismeldestellen);

                        FileSaver.saveAs(new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }), `envl_${envelope.fileSuffix}.xml`);  // TODO: Add envelope content
                        FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), `export-pm_${envelope.fileSuffix}.csv`);

                        observer.next({ type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count } as exporter.Action);
                        observer.complete();
                    });
                }))
        );
}
