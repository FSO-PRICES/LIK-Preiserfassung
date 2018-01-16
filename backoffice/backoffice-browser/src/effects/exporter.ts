import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { assign, keyBy, orderBy, flatten } from 'lodash';

import { Models as P, preismeldestelleId, preismeldungId, preismeldungRefId, pmsSortId } from 'lik-shared';

import * as fromRoot from '../reducers';
import * as exporter from '../actions/exporter';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
    getAllDocumentsFromDb,
    getDatabase,
} from './pouchdb-utils';
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
                                    // const preismeldungenToExport = preismeldungBags.filter(
                                    //     bag => bag.pm.istAbgebucht && xxx.some(y => y === bag.pm._id)
                                    // );
                                    // comment out the following line when re-exporting
                                    const preismeldungenToExport = preismeldungBags.filter(
                                        bag =>
                                            bag.pm.istAbgebucht &&
                                            !alreadyExportedPreismeldungIds.some(y => y === bag.pm._id)
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
                            return getDatabaseAsObservable(dbNames.preismeldung) // Load erhebungsmonat from preismeldungen db
                                .flatMap(db =>
                                    getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(
                                        erhebungsmonat => erhebungsmonat
                                    )
                                )
                                .flatMap(erhebungsmonat => {
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
                                        .map(() => ({ erhebungsmonat, messageId }));
                                })
                                .flatMap(({ erhebungsmonat, messageId }) =>
                                    doAsyncAsObservable(() => {
                                        const content =
                                            toCsv(
                                                preparePmForExport(
                                                    filteredPreismeldungBags,
                                                    erhebungsmonat.monthAsString
                                                )
                                            ) + '\n';
                                        const count = filteredPreismeldungBags.length;
                                        const envelope = createEnvelope(MessageTypes.Preismeldungen, messageId);

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
                                );
                        })
                        .catch(error =>
                            Observable.of({
                                type: 'EXPORT_PREISMELDUNGEN_FAILURE',
                                payload: error.message,
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
                    return getDatabaseAsObservable(dbNames.preismeldestelle)
                        .flatMap(db => db.bulkDocs(preismeldestellen, { new_edits: false })) // new_edits: false -> enables the insertion of foreign docs
                        .flatMap(() =>
                            // retrieve all pms documents from 'master' preismeldestelle db with the assigned erhebungsmonat
                            getDatabaseAsObservable(dbNames.preismeldestelle).flatMap(db =>
                                getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()).then(
                                    updatedPreismeldestellen =>
                                        getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(
                                            erhebungsmonat => ({ updatedPreismeldestellen, erhebungsmonat })
                                        )
                                )
                            )
                        )
                        .flatMap(({ updatedPreismeldestellen, erhebungsmonat }) =>
                            resetAndContinueWith(
                                { type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                                doAsyncAsObservable(() => {
                                    const content =
                                        toCsv(
                                            preparePmsForExport(updatedPreismeldestellen, erhebungsmonat.monthAsString)
                                        ) + '\n';
                                    const count = updatedPreismeldestellen.length;
                                    const envelope = createEnvelope(MessageTypes.Preismeldestellen);

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
                        payload: error.message,
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
                    return getDatabaseAsObservable(dbNames.preismeldung) // Load erhebungsmonat from preismeldungen db
                        .flatMap(db =>
                            getDocumentByKeyFromDb<P.Erhebungsmonat>(db, 'erhebungsmonat').then(erhebungsmonat => ({
                                erhebungsorgannummer: payload,
                                erhebungsmonat,
                            }))
                        )
                        .flatMap(x =>
                            getPePreiszuweisungen(preiserheber).map(peZuweisungen => assign(x, { peZuweisungen }))
                        )
                        .flatMap(({ peZuweisungen, erhebungsmonat, erhebungsorgannummer }) =>
                            resetAndContinueWith(
                                { type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action,
                                doAsyncAsObservable(() => {
                                    const content =
                                        toCsv(
                                            preparePreiserheberForExport(
                                                peZuweisungen,
                                                erhebungsmonat.monthAsString,
                                                erhebungsorgannummer
                                            )
                                        ) + '\n';
                                    const count = peZuweisungen.length;
                                    const envelope = createEnvelope(MessageTypes.Preiserheber);

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
                    Observable.of({ type: 'EXPORT_PREISERHEBER_FAILURE', payload: error.message } as exporter.Action)
                )
        );
}

function getPePreiszuweisungen(preiserheber: P.Erheber[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisung).flatMap(db =>
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
