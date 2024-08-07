import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as FileSaver from 'file-saver';
import { assign, flatten, keyBy, orderBy } from 'lodash';
import { combineLatest, of } from 'rxjs';
import { catchError, concat, flatMap, map, mergeMap, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { ElectronService, Models as P, PreismeldungAction, preismeldestelleId, preismeldungId } from '@lik-shared';

import { createClearControllingAction } from '../actions/controlling';
import * as exporter from '../actions/exporter';
import { copyUserDbErheberDetailsToPreiserheberDb } from '../common/controlling-functions';
import { blockIfNotLoggedIn, resetAndContinueWith } from '../common/effects-extensions';
import { MessageTypes, createEnvelope, createMesageId } from '../common/envelope-extensions';
import { toCsv } from '../common/file-extensions';
import {
    dbNames,
    getAllDocumentsForPrefixFromDb,
    getAllDocumentsFromDb,
    getAllPreismeldungenStatus,
    getDatabase,
    getDatabaseAsObservable,
    getDocumentByKeyFromDb,
} from '../common/pouchdb-utils';
import {
    preparePmForExport,
    preparePmForExportAll,
    preparePmsForExport,
    preparePreiserheberForExport,
} from '../common/presta-data-mapper';
import {
    getAllDocumentsForPrefixFromUserDbs,
    getAllUnexportedPm,
    getAllUploadedPm,
    loadAllPreiserheber,
    loadAllPreismeldestellen,
    loadAllPreismeldungenForExport,
    updateMissingStichtage,
} from '../common/user-db-values';
import * as fromRoot from '../reducers';

type ExportSettings = P.SettingProperties & P.SedexSettingsProperties;

@Injectable()
export class ExporterEffects {
    settings$ = combineLatest(
        this.store.select(fromRoot.getSettings),
        this.store.select(fromRoot.getSedexSettings),
    ).pipe(map(([currentSetting, sedexSetting]) => ({ ...currentSetting, ...sedexSetting })));

    public preismeldungenStatus$ = this.store.select(fromRoot.getPreismeldungenStatusMap);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private electronService: ElectronService,
        private translateService: TranslateService,
    ) {}

    exportPreismeldungen$ = createEffect(() =>
        this.actions$.pipe(
            ofType('EXPORT_PREISMELDUNGEN'),
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                resetAndContinueWith(
                    { type: 'EXPORT_PREISMELDUNGEN_RESET' } as exporter.Action,
                    getDatabaseAsObservable(dbNames.exports).pipe(
                        mergeMap((db) => db.allDocs({ include_docs: true })),
                        switchMap((alreadyExportedPm) =>
                            getAllUploadedPm().then((preismeldungen) =>
                                updateMissingStichtage(preismeldungen).then(() => alreadyExportedPm),
                            ),
                        ),
                        mergeMap((alreadyExportedPm) => {
                            const alreadyExportedPmIds: string[] = flatten(
                                alreadyExportedPm.rows.map((row: any) => (row.doc.preismeldungIds as any[]) || []),
                            );
                            return getAllUnexportedPm(alreadyExportedPmIds);
                        }),
                        mergeMap((preismeldungen) => loadAllPreismeldungenForExport(preismeldungen, true)),
                        mergeMap((preismeldungBags) =>
                            getDatabaseAsObservable(dbNames.warenkorb).pipe(
                                mergeMap((db) => db.get('warenkorb') as Promise<P.WarenkorbDocument>),
                                mergeMap((warenkorbDoc) => {
                                    return getDatabaseAsObservable(dbNames.exports).pipe(
                                        mergeMap((db) => db.allDocs({ include_docs: true })),
                                        map((x) => {
                                            // code for re-exporting an existing export
                                            // const xxx = (x.rows as any[]).find(row => row.id === '1515069593977').doc
                                            //     .preismeldungIds;
                                            // const preismeldungenToExport = preismeldungen.filter(
                                            //     pm => pm.istAbgebucht && xxx.some(y => y === pm._id)
                                            // );
                                            // comment out the following line when re-exporting
                                            if (preismeldungBags.length === 0)
                                                throw new Error(
                                                    this.translateService.instant(
                                                        'exceptions.export.keine_abgebuchte_pm',
                                                    ),
                                                );
                                            return orderBy(preismeldungBags, [
                                                (bag) =>
                                                    warenkorbDoc.products.findIndex(
                                                        (p) => bag.pm.epNummer === p.gliederungspositionsnummer,
                                                    ),
                                                (bag) => +bag.pm.pmsNummer,
                                                (bag) => +bag.pm.laufnummer,
                                            ]);
                                        }),
                                    );
                                }),
                                withLatestFrom(this.settings$),
                                mergeMap(([filteredPreismeldungBags, settings]) =>
                                    createExportPm(
                                        this.electronService,
                                        this.translateService,
                                        filteredPreismeldungBags,
                                        settings,
                                    ),
                                ),
                                map((count) => ({ type: 'EXPORT_PREISMELDUNGEN_SUCCESS', payload: count })),
                                concat(
                                    of(createClearControllingAction()),
                                    of({ type: 'PREISMELDUNGEN_RESET' } as PreismeldungAction),
                                ),
                            ),
                        ),
                        catchError((error) =>
                            of({
                                type: 'EXPORT_PREISMELDUNGEN_FAILURE',
                                payload: parseError(error, this.translateService),
                            } as exporter.Action),
                        ),
                    ),
                ),
            ),
        ),
    );

    exportAllPreismeldungen$ = createEffect(() =>
        this.actions$.pipe(
            ofType('EXPORT_ALL_PREISMELDUNGEN'),
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                resetAndContinueWith(
                    { type: 'EXPORT_ALL_PREISMELDUNGEN_RESET' } as exporter.Action,
                    //all preismeldungen in user DBs
                    getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId()).pipe(
                        mergeMap((preismeldungen) => loadAllPreismeldungenForExport(preismeldungen, false)),
                        withLatestFrom(
                            getDatabaseAsObservable(dbNames.exports).pipe(
                                mergeMap((db) => db.allDocs({ include_docs: true })),
                                map((x) =>
                                    flatten(x.rows.map((row: any) => (row.doc.preismeldungIds as string[]) || [])),
                                ),
                            ),
                            getAllPreismeldungenStatus(),
                        ),
                        mergeMap(async ([preismeldungBags, exportedPmIds, preismeldungenStatus]) => {
                            const preismeldungenDb = await getDatabase(dbNames.preismeldungen);
                            const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(
                                preismeldungenDb,
                                'erhebungsmonat',
                            );
                            return preparePmForExportAll(
                                preismeldungBags,
                                erhebungsmonat.monthAsString,
                                exportedPmIds,
                                preismeldungenStatus.statusMap,
                            );
                        }),
                        withLatestFrom(this.settings$),
                        mergeMap(([preismeldungenBags, settings]) => {
                            return exportAllPreismeldungen(
                                this.electronService,
                                this.translateService,
                                settings,
                                preismeldungenBags,
                            );
                        }),
                        map((x) => ({ type: 'EXPORT_ALL_PREISMELDUNGEN_SUCCESS', payload: x })),
                        catchError((error) =>
                            of({
                                type: 'EXPORT_ALL_PREISMELDUNGEN_FAILURE',
                                payload: parseError(error, this.translateService),
                            } as exporter.Action),
                        ),
                    ),
                ),
            ),
        ),
    );

    exportPreismeldestellen$ = createEffect(() =>
        this.actions$.pipe(
            ofType('EXPORT_PREISMELDESTELLEN'),
            blockIfNotLoggedIn(this.store),
            flatMap(() =>
                resetAndContinueWith(
                    { type: 'EXPORT_PREISMELDESTELLEN_RESET' } as exporter.Action,
                    loadAllPreismeldestellen().pipe(
                        flatMap((preismeldestellen) =>
                            getDatabaseAsObservable(dbNames.preismeldestellen).pipe(
                                flatMap((db) => db.bulkDocs(preismeldestellen, { new_edits: false })), // new_edits: false -> enables the insertion of foreign docs
                            ),
                        ),
                        withLatestFrom(this.settings$),
                        flatMap(([, settings]) =>
                            createExportPms(this.electronService, this.translateService, settings),
                        ),
                        map((count) => ({ type: 'EXPORT_PREISMELDESTELLEN_SUCCESS', payload: count })),
                        catchError((error) =>
                            of({
                                type: 'EXPORT_PREISMELDESTELLEN_FAILURE',
                                payload: error,
                            } as exporter.Action),
                        ),
                    ),
                ),
            ),
        ),
    );

    exportPreiserheber$ = createEffect(() =>
        this.actions$.pipe(
            ofType('EXPORT_PREISERHEBER'),
            blockIfNotLoggedIn(this.store),
            flatMap(({ payload }) => copyUserDbErheberDetailsToPreiserheberDb().pipe(map(() => payload))),
            flatMap((payload) =>
                resetAndContinueWith(
                    { type: 'EXPORT_PREISERHEBER_RESET' } as exporter.Action,
                    loadAllPreiserheber().pipe(
                        flatMap((preiserheber) =>
                            getPePreiszuweisungen(preiserheber).pipe(
                                map((pePreiszuweisungen) => ({
                                    preiserheber,
                                    pePreiszuweisungen,
                                })),
                            ),
                        ),
                        withLatestFrom(this.settings$),
                        flatMap(([{ pePreiszuweisungen }, settings]) =>
                            createExportPe(
                                this.electronService,
                                this.translateService,
                                pePreiszuweisungen,
                                settings,
                                payload,
                            ),
                        ),
                        map((count) => ({ type: 'EXPORT_PREISERHEBER_SUCCESS', payload: count })),
                        catchError((error) =>
                            of({ type: 'EXPORT_PREISERHEBER_FAILURE', payload: error } as exporter.Action),
                        ),
                    ),
                ),
            ),
        ),
    );
}

function getPePreiszuweisungen(preiserheber: P.Erheber[]) {
    return getDatabaseAsObservable(dbNames.preiszuweisungen).pipe(
        flatMap((db) =>
            getAllDocumentsFromDb<P.Preiszuweisung>(db).then((preiszuweisungen) => {
                const zuweisungsMap = keyBy(preiszuweisungen, (pz) => pz.preiserheberId);
                return preiserheber.map((pe) =>
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
    translateService: TranslateService,
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
    const messageId = await createFiles(
        electronService,
        translateService,
        settings,
        validations,
        MessageTypes.Preismeldungen,
    );

    const exportsDb = await getDatabase(dbNames.exports);
    const now = Date.now();
    await exportsDb.put({
        _id: now.toString(),
        ts: new Date(now),
        messageId,
        preismeldungIds: filteredPreismeldungBags.map((x) => x.pm._id),
    });
    return count;
}

async function createExportPms(
    electronService: ElectronService,
    translateService: TranslateService,
    settings: ExportSettings,
) {
    const preismeldestellenDb = await getDatabase(dbNames.preismeldestellen);
    const preismeldestellen = await getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(
        preismeldestellenDb,
        preismeldestelleId(),
    );
    if (preismeldestellen.length === 0) throw new Error(translateService.instant('exceptions.export.keine_pms'));
    const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(preismeldestellenDb, 'erhebungsmonat');
    const validations = preparePmsForExport(preismeldestellen, erhebungsmonat.monthAsString);
    const count = preismeldestellen.length;
    const messageId = await createFiles(
        electronService,
        translateService,
        settings,
        validations,
        MessageTypes.Preismeldestellen,
    );

    return count;
}

async function createExportPe(
    electronService: ElectronService,
    translateService: TranslateService,
    preiserheber: (P.Erheber & { pmsNummers: string[] })[],
    settings: ExportSettings,
    erhebungsorgannummer: string,
) {
    const preismeldungenDb = await getDatabase(dbNames.preismeldungen);
    const erhebungsmonat = await getDocumentByKeyFromDb<P.Erhebungsmonat>(preismeldungenDb, 'erhebungsmonat');
    const validations = preparePreiserheberForExport(preiserheber, erhebungsmonat.monthAsString, erhebungsorgannummer);
    console.log('😎 validations', validations);
    const count = preiserheber.length;
    const messageId = await createFiles(
        electronService,
        translateService,
        settings,
        validations,
        MessageTypes.Preiserheber,
    );

    return count;
}

async function exportAllPreismeldungen(
    electronService: ElectronService,
    translateService: TranslateService,
    settings: ExportSettings,
    preismeldungBags: {
        pm: P.Preismeldung;
        refPreismeldung: P.PreismeldungReference;
        sortierungsnummer: number;
    }[],
) {
    // const data = preismeldungBags.map((a: P.Preismeldung) => {
    //     const modifiedObject = {};
    //     Object.entries(a).forEach(([key, value]) => {
    //         modifiedObject[key] = value instanceof Object ? JSON.stringify(value) : value;
    //     });
    //     return modifiedObject;
    // });

    const content = toCsv(preismeldungBags) + '\n';
    const { targetPath } = settings.export;

    try {
        await saveFile(
            electronService,
            translateService,
            content,
            `data_all_preismeldungen_${createMesageId()}.txt`,
            'text/csv;charset=utf-8',
            targetPath,
        );
        return preismeldungBags.length;
    } catch (error) {
        return 0;
    }
}

async function createFiles(
    electronService: ElectronService,
    translateService: TranslateService,
    settings: ExportSettings,
    validations: { isValid: boolean; entity?: any; error?: string }[],
    messageType: string,
) {
    if (!validations.every((x) => x.isValid))
        throw new (function () {
            this.validations = validations.filter((x) => !x.isValid);
        })();
    const content = toCsv(validations.map((x: any) => x.entity)) + '\n';
    const messageId = createMesageId();
    const { recipientId, senderId } = settings.transportRequestSettings;
    const envelope = createEnvelope(messageType, messageId, senderId, recipientId);
    const { targetPath } = settings.export;

    await saveFile(
        electronService,
        translateService,
        envelope.content,
        `envl_${envelope.fileSuffix}.xml`,
        'application/xml;charset=utf-8',
        targetPath,
    );

    await saveFile(
        electronService,
        translateService,
        content,
        `data_${envelope.fileSuffix}.txt`,
        'text/csv;charset=utf-8',
        targetPath,
    );

    return messageId;
}

async function saveFile(
    electronService: ElectronService,
    translateService: TranslateService,
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
                reject(saveResult.error || translateService.instant('exceptions.export.kein_export_pfad'));
            } else {
                resolve(undefined);
            }
        } else {
            FileSaver.saveAs(new Blob([content], { type: 'application/xml;charset=utf-8' }), fileName);
            resolve(undefined);
        }
    });
}

function parseError(error: any, translateService: TranslateService): { validations: { error: string }[] } {
    if (error.validations) {
        return error;
    }
    if (error.message) {
        return { validations: [{ error: error.message }] };
    }
    if (error.code === 'ENOENT') {
        return {
            validations: [
                { error: translateService.instant('exceptions.export.pfad_existiert_nicht', { path: error.path }) },
            ],
        };
    }
    return { validations: [{ error }] };
}
