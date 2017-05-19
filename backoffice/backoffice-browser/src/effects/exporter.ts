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

const EnvelopeContent = `
<?xml version="1.0"?>
<eCH-0090:envelope version="1.0" xmlns:eCH-0090="http://www.ech.ch/xmlns/eCH-0090/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ech.ch/xmlns/eCH-0090/1 http://www.ech.ch/xmlns/eCH-0090/1/eCH-0090-1-0.xsd">
 <eCH-0090:messageId></eCH-0090:messageId>
 <eCH-0090:messageType>1025</eCH-0090:messageType>
 <eCH-0090:messageClass>0</eCH-0090:messageClass>
 <eCH-0090:senderId>4-802346-0</eCH-0090:senderId>
 <eCH-0090:recipientId>4-802346-0</eCH-0090:recipientId>
 <eCH-0090:eventDate>2017-02-27T15:30:00</eCH-0090:eventDate>
 <eCH-0090:messageDate>2017-02-27T15:30:00</eCH-0090:messageDate>
 <eCH-0090:loopback authorise="true"/>
 <eCH-0090:testData>
   <eCH-0090:name>test</eCH-0090:name>
   <eCH-0090:value>test</eCH-0090:value>
 </eCH-0090:testData>
</eCH-0090:envelope>
`;

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

                    FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
                    FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-pm-to-presta.csv');

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

                    FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
                    FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-pms-to-presta.csv');

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

                        FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
                        FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-preiserheber-to-presta.csv');

                        observer.next({ type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count } as exporter.Action);
                        observer.complete();
                    });
                }))
        );
}
