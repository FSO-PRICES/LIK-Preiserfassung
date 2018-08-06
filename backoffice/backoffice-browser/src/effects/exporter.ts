import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { assign, keyBy, orderBy, flatten } from 'lodash';

import {
    Models as P,
    preismeldestelleId,
    preismeldungId,
    preismeldungRefId,
    PreismeldungAction,
    pmsSortId,
} from 'lik-shared';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import { createClearControllingAction } from '../actions/controlling';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
    getAllDocumentsFromDb,
    getDatabase,
} from '../common/pouchdb-utils';
import { toCsv } from '../common/file-extensions';
import { preparePmsForExport, preparePreiserheberForExport, preparePmForExport } from '../common/presta-data-mapper';
import { continueEffectOnlyIfTrue, resetAndContinueWith, doAsyncAsObservable } from '../common/effects-extensions';
import {
    loadAllPreismeldestellen,
    loadAllPreismeldungenForExport,
    loadAllPreiserheber,
} from '../common/user-db-values';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import { createEnvelope, MessageTypes, createMesageId } from '../common/envelope-extensions';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ExporterEffects {
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);
    settings$ = this.store.select(fromRoot.getSettings);

    constructor(private actions$: Actions, private store: Store<fromRoot.AppState>) {}

    @Effect()
    exportPreismeldungen$ = this.actions$
        .ofType('EXPORT_PREISMELDUNGEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() =>
            resetAndContinueWith(
                { type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action,
                loadAllPreismeldungenForExport().flatMap(preismeldungBags =>
                    getDatabaseAsObservable(dbNames.warenkorb)
                        .flatMap(db => db.get('warenkorb') as Promise<P.WarenkorbDocument>)
                        .flatMap(warenkorbDoc => {
                            return getDatabaseAsObservable(dbNames.exports)
                                .flatMap(db => db.allDocs({ include_docs: true }))
                                .map(x => {
                                    const alreadyExportedPreismeldungIds = flatten(
                                        x.rows.map((row: any) => (row.doc.preismeldungIds as any[]) || [])
                                    );
                                    // code for re-exporting an existing export
                                    // const xxx = (x.rows as any[]).find(row => row.id === '1515069593977').doc
                                    //     .preismeldungIds;
                                    // const preismeldungenToExport = preismeldungen.filter(
                                    //     pm => pm.istAbgebucht && xxx.some(y => y === pm._id)
                                    // );
                                    // comment out the following line when re-exporting
                                    const preismeldungenToExport = preismeldungBags.filter(
                                        bag => !alreadyExportedPreismeldungIds.some(y => y === bag.pm._id)
                                    );
                                    if (preismeldungenToExport.length === 0)
                                        throw new Error('Keine neue abgebuchte Preismeldungen vorhanden.');
                                    return orderBy(preismeldungenToExport, [
                                        bag =>
                                            warenkorbDoc.products.findIndex(
                                                p => bag.pm.epNummer === p.gliederungspositionsnummer
                                            ),
                                        bag => +bag.pm.pmsNummer,
                                        bag => +bag.pm.laufnummer,
                                    ]);
                                });
                        })
                        .flatMap(filteredPreismeldungBags => {
                            return getDatabaseAsObservable(dbNames.preismeldungen) // Load erhebungsmonat from preismeldungen db
                                .flatMap(db =>
                                    getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(
                                        erhebungsmonat => erhebungsmonat
                                    )
                                )
                                .map(erhebungsmonat => {
                                    const validations = preparePmForExport(
                                        filteredPreismeldungBags,
                                        erhebungsmonat.monthAsString
                                    );
                                    if (!validations.every(x => x.isValid))
                                        throw new function() {
                                            this.validations = validations.filter(x => !x.isValid);
                                        }();
                                    const content = toCsv(validations.map((x: any) => x.entity)) + '\n';
                                    return { erhebungsmonat, content };
                                })
                                .flatMap(({ erhebungsmonat, content }) => {
                                    const messageId = createMesageId();
                                    return getDatabaseAsObservable(dbNames.exports)
                                        .flatMap(db => {
                                            const now = Date.now();
                                            return db.put({
                                                _id: now.toString(),
                                                ts: new Date(now),
                                                messageId,
                                                preismeldungIds: filteredPreismeldungBags.map(x => x.pm._id),
                                            });
                                        })
                                        .map(() => ({ erhebungsmonat, messageId, content }));
                                })
                                .withLatestFrom(this.settings$, (data, settings) => ({
                                    ...data,
                                    ...settings.transportRequestSettings,
                                }))
                                .flatMap(({ erhebungsmonat, messageId, senderId, recipientId, content }) =>
                                    doAsyncAsObservable(() => {
                                        const count = filteredPreismeldungBags.length;
                                        const envelope = createEnvelope(
                                            MessageTypes.Preismeldungen,
                                            messageId,
                                            senderId,
                                            recipientId
                                        );

                                        FileSaver.saveAs(
                                            new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }),
                                            `envl_${envelope.fileSuffix}.xml`
                                        );
                                        FileSaver.saveAs(
                                            new Blob([content], { type: 'text/csv;charset=utf-8' }),
                                            `data_${envelope.fileSuffix}.txt`
                                        );

                                        return { type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count };
                                    })
                                )
                                .concat(
                                    Observable.of(createClearControllingAction()),
                                    Observable.of({ type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction)
                                );
                        })
                        .catch(error =>
                            Observable.of({
                                type: 'EXPORT_PREISMELDUNGEN_FAILURE',
                                payload: error,
                            } as exporter.Action)
                        )
                )
            )
        );

    @Effect()
    exportPreismeldestellen$ = this.actions$
        .ofType('EXPORT_PREISMELDESTELLEN')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(() =>
            loadAllPreismeldestellen()
                .flatMap(preismeldestellen => {
                    if (preismeldestellen.length === 0) throw new Error('Keine preismeldestellen vorhanden.');
                    return getDatabaseAsObservable(dbNames.preismeldestellen)
                        .flatMap(db => db.bulkDocs(preismeldestellen, { new_edits: false })) // new_edits: false -> enables the insertion of foreign docs
                        .flatMap(() =>
                            // retrieve all pms documents from 'master' preismeldestelle db with the assigned erhebungsmonat
                            getDatabaseAsObservable(dbNames.preismeldestellen).flatMap(db =>
                                getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()).then(
                                    updatedPreismeldestellen =>
                                        getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(
                                            erhebungsmonat => ({ updatedPreismeldestellen, erhebungsmonat })
                                        )
                                )
                            )
                        )
                        .map(({ updatedPreismeldestellen, erhebungsmonat }) => {
                            const validations = preparePmsForExport(
                                updatedPreismeldestellen,
                                erhebungsmonat.monthAsString
                            );
                            if (!validations.every(x => x.isValid))
                                throw new function() {
                                    this.validations = validations.filter(x => !x.isValid);
                                }();
                            const content = toCsv(validations.map((x: any) => x.entity)) + '\n';
                            return { erhebungsmonat, content, updatedPreismeldestellen };
                        })
                        .withLatestFrom(this.settings$, (data, settings) => ({
                            ...data,
                            ...settings.transportRequestSettings,
                        }))
                        .flatMap(({ content, erhebungsmonat, senderId, recipientId, updatedPreismeldestellen }) =>
                            resetAndContinueWith(
                                { type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                                doAsyncAsObservable(() => {
                                    const count = updatedPreismeldestellen.length;
                                    const envelope = createEnvelope(
                                        MessageTypes.Preismeldestellen,
                                        createMesageId(),
                                        senderId,
                                        recipientId
                                    );

                                    FileSaver.saveAs(
                                        new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }),
                                        `envl_${envelope.fileSuffix}.xml`
                                    );
                                    FileSaver.saveAs(
                                        new Blob([content], { type: 'text/csv;charset=utf-8' }),
                                        `data_${envelope.fileSuffix}.txt`
                                    );

                                    return { type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count };
                                })
                            )
                        );
                })
                .catch(error =>
                    Observable.of({
                        type: 'EXPORT_PREISMELDESTELLEN_FAILURE',
                        payload: error,
                    } as exporter.Action)
                )
        );

    @Effect()
    exportPreiserheber$ = this.actions$
        .ofType('EXPORT_PREISERHEBER')
        .let(continueEffectOnlyIfTrue(this.isLoggedIn$))
        .flatMap(({ payload }) => copyUserDbErheberDetailsToPreiserheberDb().map(() => payload))
        .flatMap(payload =>
            loadAllPreiserheber()
                .flatMap(preiserheber => {
                    if (preiserheber.length === 0) throw new Error('Keine preiserheber erfasst.');
                    return getDatabaseAsObservable(dbNames.preismeldungen) // Load erhebungsmonat from preismeldungen db
                        .flatMap(db =>
                            getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({
                                erhebungsorgannummer: payload,
                                erhebungsmonat,
                            }))
                        )
                        .flatMap(x =>
                            getPePreiszuweisungen(preiserheber).map(peZuweisungen => assign(x, { peZuweisungen }))
                        )
                        .map(({ peZuweisungen, erhebungsmonat, erhebungsorgannummer }) => {
                            const validations = preparePreiserheberForExport(
                                peZuweisungen,
                                erhebungsmonat.monthAsString,
                                erhebungsorgannummer
                            );
                            if (!validations.every(x => x.isValid))
                                throw new function() {
                                    this.validations = validations.filter(x => !x.isValid);
                                }();
                            const content = toCsv(validations.map((x: any) => x.entity)) + '\n';
                            return { peZuweisungen, content };
                        })
                        .withLatestFrom(this.settings$, (data, settings) => ({
                            ...data,
                            ...settings.transportRequestSettings,
                        }))
                        .flatMap(({ peZuweisungen, content, senderId, recipientId }) =>
                            resetAndContinueWith(
                                { type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action,
                                doAsyncAsObservable(() => {
                                    const count = peZuweisungen.length;
                                    const envelope = createEnvelope(
                                        MessageTypes.Preiserheber,
                                        createMesageId(),
                                        senderId,
                                        recipientId
                                    );

                                    FileSaver.saveAs(
                                        new Blob([envelope.content], { type: 'application/xml;charset=utf-8' }),
                                        `envl_${envelope.fileSuffix}.xml`
                                    );
                                    FileSaver.saveAs(
                                        new Blob([content], { type: 'text/csv;charset=utf-8' }),
                                        `data_${envelope.fileSuffix}.txt`
                                    );

                                    return { type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count };
                                })
                            )
                        );
                })
                .catch(error =>
                    Observable.of({ type: 'EXPORT_PREISERHEBER_FAILURE', payload: error } as exporter.Action)
                )
        );
}

function getPePreiszuweisungen(preiserheber: P.Erheber[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisungen).flatMap(db =>
        getAllDocumentsFromDb<P.Preiszuweisung>(db).then(preiszuweisungen => {
            const zuweisungsMap = keyBy(preiszuweisungen, pz => pz.preiserheberId);
            return preiserheber.map(pe =>
                assign({}, pe, {
                    pmsNummers:
                        (zuweisungsMap[pe.username] && zuweisungsMap[pe.username].preismeldestellenNummern) || [],
                })
            );
        })
    );
}
