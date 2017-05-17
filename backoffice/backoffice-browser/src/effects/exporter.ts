import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import * as FileSaver from 'file-saver';

import { Models as P } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { toCsv } from '../common/file-extensions';
import { preparePmForExport, preparePmsForExport, preparePreiserheberForExport } from '../common/presta-data-mapper';
import { listUserDatabases, getDatabase, getAllDocumentsForPrefixFromDb, dbNames, getAllDocumentsForKeysFromDb, getDatabaseAsObservable, getDocumentByKeyFromDb } from './pouchdb-utils';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
import { cloneDeep, assign, isEqual } from 'lodash';

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
        .flatMap(() => listUserDatabases())
        .do(x => console.log('result of list', x))
        .map(() => ({ type: 'ACTION_IGNORE' }));
        // .flatMap(({ payload }) =>
        //     Observable.of({ type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action)
        //         .merge(Observable.create((observer: Observer<exporter.Action>) => {
        //             setTimeout(() => {
        //                 const content = toCsv(preparePmForExport(payload));
        //                 const count = payload.length;

        //                 FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
        //                 FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-preismeldungen-to-presta.csv');

        //                 observer.next({ type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count } as exporter.Action);
        //                 observer.complete();
        //             });
        //         }))
        // );

    @Effect()
    exportPreismeldestellen$ = this.actions$.ofType('EXPORT_PREISMELDESTELLEN')
        // .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() => listUserDatabases()) // fetch all user_ database names
        .flatMap(dbnames => // fetch all pms documents from user_ databases
            Observable.from(dbnames)
                .flatMap(dbname => getDatabase(dbname))
                .flatMap(db => getAllDocumentsForPrefixFromDb<P.AdvancedPreismeldestelle>(db, 'pms/'))
        )
        .flatMap(userPreismeldestellen => // fetch pms documents from 'master' preismeldestelle db
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => getAllDocumentsForKeysFromDb<P.AdvancedPreismeldestelle>(db, userPreismeldestellen.map(p => p._id)))
                .map(masterPreismeldestellen => ({ userPreismeldestellen, masterPreismeldestellen }))
        )
        .map(({ userPreismeldestellen, masterPreismeldestellen }) => // create a new collection of pms documents updated from user_ pms documents
            masterPreismeldestellen
                .map(masterPms => {
                    const userPms = userPreismeldestellen.find(p => p._id === masterPms._id);
                    if (!userPms) return masterPms;
                    const propertiesToUpdated = {
                        pmsNummer: userPms.pmsNummer,
                        name: userPms.name,
                        supplement: userPms.supplement,
                        street: userPms.street,
                        postcode: userPms.postcode,
                        town: userPms.town,
                        erhebungsregion: userPms.erhebungsregion,
                        erhebungsart: userPms.erhebungsart,
                        erhebungshaeufigkeit: userPms.erhebungshaeufigkeit,
                        erhebungsartComment: userPms.erhebungsartComment,
                        kontaktpersons: cloneDeep(userPms.kontaktpersons),
                        languageCode: userPms.languageCode,
                        telephone: userPms.telephone,
                        email: userPms.email,
                    };
                    return assign({}, masterPms, propertiesToUpdated);
                })
                .filter(newMasterPms => !isEqual(newMasterPms, masterPreismeldestellen.find(p => p._id === newMasterPms._id)))
        )
        .flatMap(updatedPreismeldestellen => // write updated pms documents back to 'master' preismeldestelle db
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => db.bulkDocs(updatedPreismeldestellen))
        )
        .flatMap(() => // retrieve all pms documents from 'master' preismeldestelle db with the assigned erhebungsmonat
            getDatabaseAsObservable(dbNames.preismeldestelle)
                .flatMap(db => getAllDocumentsForPrefixFromDb<P.AdvancedPreismeldestelle>(db, 'pms/')
                    .then(preismeldestellen => getDocumentByKeyFromDb<string>(db, 'erhebungsmonat').then(erhebungsmonat => ({ preismeldestellen, erhebungsmonat })))
                )
        )
        .flatMap(({ preismeldestellen, erhebungsmonat }) => // export to csv
            // resetAndDo({ type: '' }, Observable.create((observer: Observer<exporter.Action>) => {
            //         setTimeout(() => {
            //             const content = toCsv(preparePmsForExport(preismeldestellen));
            //             const count = preismeldestellen.length;

            //             FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
            //             FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-pms-to-presta.csv');

            //             observer.next({ type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count } as exporter.Action);
            //             observer.complete();
            //         });
            Observable.of({ type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action)
                .merge(Observable.create((observer: Observer<exporter.Action>) => {
                    setTimeout(() => {
                        const content = toCsv(preparePmsForExport(preismeldestellen, erhebungsmonat));
                        const count = preismeldestellen.length;

                        FileSaver.saveAs(new Blob([EnvelopeContent], { type: 'application/xml;charset=utf-8' }), 'envelope.xml');  // TODO: Add envelope content
                        FileSaver.saveAs(new Blob([content], { type: 'text/csv;charset=utf-8' }), 'export-pms-to-presta.csv');

                        observer.next({ type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count } as exporter.Action);
                        observer.complete();
                    });
                }))
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
