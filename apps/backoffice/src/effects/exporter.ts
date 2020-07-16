import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { assign, flatten, keyBy, orderBy } from 'lodash';
import { ElectronService } from 'ngx-electron';
import { of, combineLatest } from 'rxjs';
import { catchError, concat, flatMap, map, withLatestFrom } from 'rxjs/operators';

import { Models as P, preismeldestelleId, PreismeldungAction } from '@lik-shared';

import { createClearControllingAction } from '../actions/controlling';
import * as exporter from '../actions/exporter';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import { blockIfNotLoggedIn, resetAndContinueWith } from '../common/effects-extensions';
import { createEnvelope, createMesageId, MessageTypes } from '../common/envelope-extensions';
import { toCsv } from '../common/file-extensions';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDb,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
} from '../common/pouchdb-utils';
import { preparePmForExport, preparePmsForExport, preparePreiserheberForExport } from '../common/presta-data-mapper';
import {
    loadAllPreiserheber,
    loadAllPreismeldestellen,
    loadAllPreismeldungenForExport,
} from '../common/user-db-values';
import * as fromRoot from '../reducers';

type ExportSettings = P.SettingProperties & P.SedexSettingsProperties;

@Injectable()
export class ExporterEffects {
    settings$ = combineLatest(
        this.store.select(fromRoot.getSettings),
        this.store.select(fromRoot.getSedexSettings),
    ).pipe(map(([currentSetting, sedexSetting]) => ({ ...currentSetting, ...sedexSetting })));

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private electronService: ElectronService,
    ) {}

    @Effect()
    exportPreismeldungen$ = this.actions$.pipe(
        ofType('EXPORT_PREISMELDUNGEN'),
        blockIfNotLoggedIn(this.store),
        flatMap(() =>
            resetAndContinueWith(
                { type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action,
                getDatabaseAsObservable(dbNames.exports).pipe(
                    flatMap(db => db.allDocs({ include_docs: true })),
                    flatMap(pm =>
                        loadAllPreismeldungenForExport(
                            flatten(pm.rows.map((row: any) => (row.doc.preismeldungIds as any[]) || [])),
                        ),
                    ),
                    flatMap(preismeldungBags =>
                        getDatabaseAsObservable(dbNames.warenkorb).pipe(
                            flatMap(db => db.get('warenkorb') as Promise<P.WarenkorbDocument>),
                            flatMap(warenkorbDoc => {
                                return getDatabaseAsObservable(dbNames.exports).pipe(
                                    flatMap(db => db.allDocs({ include_docs: true })),
                                    map(x => {
                                        // code for re-exporting an existing export
                                        // const xxx = (x.rows as any[]).find(row => row.id === '1515069593977').doc
                                        //     .preismeldungIds;
                                        // const preismeldungenToExport = preismeldungen.filter(
                                        //     pm => pm.istAbgebucht && xxx.some(y => y === pm._id)
                                        // );
                                        // comment out the following line when re-exporting
                                        if (preismeldungBags.length === 0)
                                            throw new Error('Keine neue abgebuchte Preismeldungen vorhanden.');
                                        return orderBy(preismeldungBags, [
                                            bag =>
                                                warenkorbDoc.products.findIndex(
                                                    p => bag.pm.epNummer === p.gliederungspositionsnummer,
                                                ),
                                            bag => +bag.pm.pmsNummer,
                                            bag => +bag.pm.laufnummer,
                                        ]);
                                    }),
                                );
                            }),
                            withLatestFrom(this.settings$),
                            flatMap(([filteredPreismeldungBags, settings]) =>
                                createExportPm(this.electronService, filteredPreismeldungBags, settings),
                            ),
                            map(count => ({ type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count })),
                            concat(
                                of(createClearControllingAction()),
                                of({ type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction),
                            ),
                        ),
                    ),
                    catchError(error =>
                        of({
                            type: 'EXPORT_PREISMELDUNGEN_FAILURE',
                            payload: error,
                        } as exporter.Action),
                    ),
                ),
            ),
        ),
    );

    @Effect()
    exportPreismeldestellen$ = this.actions$.pipe(
        ofType('EXPORT_PREISMELDESTELLEN'),
        blockIfNotLoggedIn(this.store),
        flatMap(() =>
            resetAndContinueWith(
                { type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                loadAllPreismeldestellen().pipe(
                    flatMap(preismeldestellen =>
                        getDatabaseAsObservable(dbNames.preismeldestellen).pipe(
                            flatMap(db => db.bulkDocs(preismeldestellen, { new_edits: false })), // new_edits: false -> enables the insertion of foreign docs
                        ),
                    ),
                    withLatestFrom(this.settings$),
                    flatMap(([, settings]) => createExportPms(this.electronService, settings)),
                    map(count => ({ type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count })),
                    catchError(error =>
                        of({
                            type: 'EXPORT_PREISMELDESTELLEN_FAILURE',
                            payload: error,
                        } as exporter.Action),
                    ),
                ),
            ),
        ),
    );

    @Effect()
    exportPreiserheber$ = this.actions$.pipe(
        ofType('EXPORT_PREISERHEBER'),
        blockIfNotLoggedIn(this.store),
        flatMap(({ payload }) => copyUserDbErheberDetailsToPreiserheberDb().pipe(map(() => payload))),
        flatMap(payload =>
            resetAndContinueWith(
                { type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action,
                loadAllPreiserheber().pipe(
                    flatMap(preiserheber =>
                        getPePreiszuweisungen(preiserheber).pipe(
                            map(pePreiszuweisungen => ({
                                preiserheber,
                                pePreiszuweisungen,
                            })),
                        ),
                    ),
                    withLatestFrom(this.settings$),
                    flatMap(([{ pePreiszuweisungen }, settings]) =>
                        createExportPe(this.electronService, pePreiszuweisungen, settings, payload),
                    ),
                    map(count => ({ type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count })),
                    catchError(error => of({ type: 'EXPORT_PREISERHEBER_FAILURE', payload: error } as exporter.Action)),
                ),
            ),
        ),
    );
}

function getPePreiszuweisungen(preiserheber: P.Erheber[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisungen).pipe(
        flatMap(db =>
            getAllDocumentsFromDb<P.Preiszuweisung>(db).then(preiszuweisungen => {
                const zuweisungsMap = keyBy(preiszuweisungen, pz => pz.preiserheberId);
                return preiserheber.map(pe =>
                    assign({}, pe, {
                        pmsNummers:
                            (zuweisungsMap[pe.username] && zuweisungsMap[pe.username].preismeldestellenNummern) || [],
                    }),
                );
            }),
        ),
    );
}

async function createExportPm(
    electronService: ElectronService,
    filteredPreismeldungBags: {
        pm: P.Preismeldung;
        refPreismeldung: P.PreismeldungReference;
        sortierungsnummer: number;
    }[],
    settings: ExportSettings,
) {
    const preismeldungenDb = await getDatabase(dbNames.preismeldungen);
    const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(preismeldungenDb, 'erhebungsmonat');
    const validations = preparePmForExport(filteredPreismeldungBags, erhebungsmonat.monthAsString);
    const count = filteredPreismeldungBags.length;
    const messageId = await createFiles(electronService, settings, validations);

    const exportsDb = await getDatabase(dbNames.exports);
    const now = Date.now();
    await exportsDb.put({
        _id: now.toString(),
        ts: new Date(now),
        messageId,
        preismeldungIds: filteredPreismeldungBags.map(x => x.pm._id),
    });
    return count;
}

async function createExportPms(electronService: ElectronService, settings: ExportSettings) {
    const preismeldestellenDb = await getDatabase(dbNames.preismeldestellen);
    const preismeldestellen = await getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(
        preismeldestellenDb,
        preismeldestelleId(),
    );
    if (preismeldestellen.length === 0) throw new Error('Keine preismeldestellen vorhanden.');
    const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(preismeldestellenDb, 'erhebungsmonat');
    const validations = preparePmsForExport(preismeldestellen, erhebungsmonat.monthAsString);
    const count = preismeldestellen.length;
    const messageId = await createFiles(electronService, settings, validations);

    return count;
}

async function createExportPe(
    electronService: ElectronService,
    preiserheber: (P.Erheber & { pmsNummers: string[] })[],
    settings: ExportSettings,
    erhebungsorgannummer: string,
) {
    const preismeldungenDb = await getDatabase(dbNames.preismeldungen);
    const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(preismeldungenDb, 'erhebungsmonat');
    const validations = preparePreiserheberForExport(preiserheber, erhebungsmonat.monthAsString, erhebungsorgannummer);
    const count = preiserheber.length;
    const messageId = await createFiles(electronService, settings, validations);

    return count;
}

async function createFiles(
    electronService: ElectronService,
    settings: ExportSettings,
    validations: { isValid: boolean; entity?: any; error?: string }[],
) {
    if (!validations.every(x => x.isValid))
        throw new function() {
            this.validations = validations.filter(x => !x.isValid);
        }();
    const content = toCsv(validations.map((x: any) => x.entity)) + '\n';
    const messageId = createMesageId();
    const { recipientId, senderId } = settings.transportRequestSettings;
    const envelope = createEnvelope(MessageTypes.Preismeldungen, messageId, senderId, recipientId);
    const { targetPath } = settings.export;

    await saveFile(
        electronService,
        envelope.content,
        `envl_${envelope.fileSuffix}.xml`,
        'application/xml;charset=utf-8',
        targetPath,
    );

    await saveFile(electronService, content, `data_${envelope.fileSuffix}.txt`, 'text/csv;charset=utf-8', targetPath);

    return messageId;
}

async function saveFile(
    electronService: ElectronService,
    content: string,
    fileName: string,
    type: 'application/xml;charset=utf-8' | 'text/csv;charset=utf-8',
    targetPath?: string,
) {
    return new Promise((resolve, reject) => {
        if (electronService.isElectronApp) {
            const saveResult = electronService.ipcRenderer.sendSync('save-file', {
                content,
                type,
                fileName,
                targetPath,
            });
            if (saveResult.state !== 1) {
                reject(saveResult.error || 'Es wurde kein Exportpfad ausgewählt');
            } else {
                resolve();
            }
        } else {
            FileSaver.saveAs(new Blob([content], { type: 'application/xml;charset=utf-8' }), fileName);
            resolve();
        }
    });
}
