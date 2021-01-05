/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { ElectronService } from 'ngx-electron';
import { flatMap, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as setting from '../actions/setting';
import {
    blockIfNotLoggedIn,
    blockIfNotLoggedInOrHasNoWritePermission,
    SimpleAction,
} from '../common/effects-extensions';
import {
    checkIfDatabaseExists,
    clearRev,
    dbNames,
    dropRemoteCouchDatabase,
    getDatabase,
    getLocalDatabase,
    getSettings,
} from '../common/pouchdb-utils';
import * as fromRoot from '../reducers';
import { CurrentSetting } from '../reducers/setting';

@Injectable()
export class SettingEffects {
    currentSetting$ = this.store.select(fromRoot.getCurrentSettings);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private electronService: ElectronService,
    ) {}

    @Effect()
    loadSetting$ = this.actions$.pipe(
        ofType('SETTING_LOAD'),
        flatMap(() => getSettings()),
        map(docs =>
            !!docs
                ? ({ type: 'SETTING_LOAD_SUCCESS', payload: docs } as setting.Action)
                : ({ type: 'SETTING_LOAD_FAIL' } as setting.Action),
        ),
    );

    @Effect()
    saveSetting$ = this.actions$.pipe(
        ofType('SAVE_SETTING'),
        withLatestFrom(this.currentSetting$, (_, currentSetting: CurrentSetting) => ({ currentSetting })),
        flatMap(({ currentSetting }) =>
            getLocalDatabase(dbNames.settings)
                .then(db => {
                    // Only check if the document exists if a revision already exists
                    if (!!currentSetting._rev) {
                        return db.get(currentSetting._id).then(doc => ({ db, doc }));
                    }
                    return Promise.resolve({ db, doc: {} as P.CouchProperties });
                })
                .then(({ db, doc }) => {
                    // Create or update the setting
                    const create = !doc._rev;
                    const setting = Object.assign({}, doc, <P.Setting>{
                        _id: currentSetting._id,
                        _rev: currentSetting._rev,
                        serverConnection: currentSetting.serverConnection,
                        general: currentSetting.general,
                    });
                    return (create ? db.post(setting) : db.put(setting)).then(response => ({ db, id: response.id }));
                })
                .then(({ db, id }) =>
                    db.get(id).then(setting => Object.assign({}, setting, { isModified: false, isSaved: true })),
                ),
        ),
        map(payload => ({ type: 'SAVE_SETTING_SUCCESS', payload } as setting.Action)),
    );

    @Effect()
    loadSedex$ = this.actions$.pipe(
        ofType(setting.loadSedex),
        switchMap(async () => {
            const db = await getDatabase(dbNames.sedex);
            return await db.get<P.SedexSettings>('sedex').catch(() => null);
        }),
        map(doc => (doc ? setting.loadSedexSuccess({ payload: doc }) : setting.loadSedexFailure())),
    );

    @Effect()
    saveSedex$ = this.actions$.pipe(
        ofType(setting.saveSedex),
        switchMap(async ({ payload }) => {
            const db = await getDatabase(dbNames.sedex);
            const prev = await db.get<P.SedexSettings>('sedex').catch(() => null);
            await db.put({ _id: 'sedex', ...(prev ? { _rev: prev._rev } : {}), ...payload });
            return db.get<P.SedexSettings>('sedex');
        }),
        map(doc => setting.saveSedexSuccess({ payload: doc })),
    );

    @Effect()
    exportDbs$ = this.actions$.pipe(
        ofType('EXPORT_DATABASES'),
        blockIfNotLoggedIn(this.store),
        switchMap(() => createDbBackups(this.electronService)),
        map(payload => ({ type: 'EXPORT_DATABASES_SUCCESS', payload } as setting.Action)),
    );

    @Effect()
    importDb$ = this.actions$.pipe(
        ofType('IMPORT_DATABASE'),
        blockIfNotLoggedInOrHasNoWritePermission<SimpleAction>(this.store),
        switchMap(action => importDbBackup(action.payload)),
        map(payload => ({ type: 'IMPORT_DATABASE_SUCCESS', payload } as setting.Action)),
    );
}

async function importDbBackup(backups: P.DatabaseBackupResult): Promise<P.DatabaseImportResult> {
    const dbsToImport = Object.keys(backups);
    const importResult: P.DatabaseImportResult = {};
    for (let i = 0; i < dbsToImport.length; i++) {
        const backup = backups[dbsToImport[i]];
        if (await checkIfDatabaseExists(backup.db)) {
            const preImportBackup = await getDbBackup(backup.db);
            const preDb = await getDatabase(
                // _users_backup... is an invalid name, use users_backup... instead
                `${backup.db.indexOf('_') === 0 ? backup.db.substr(1) : backup.db}_backup_${+new Date()}`,
            );
            await preDb.bulkDocs(preImportBackup.data.rows.map(r => clearRev(r.doc)));
            await dropRemoteCouchDatabase(backup.db);
        }
        const db = await getDatabase(backup.db);
        importResult[backup.db] = (await db.bulkDocs(backup.data.rows.map(r => clearRev(r.doc)))).length;
    }
    return importResult;
}

async function createDbBackups(electronService: ElectronService): Promise<P.DatabaseBackupResult> {
    const dbsToExport = [dbNames.users, dbNames.preiserheber, dbNames.preiszuweisungen];
    const exported: P.DatabaseBackupResult = {};

    for (let i = 0; i < dbsToExport.length; i++) {
        exported[dbsToExport[i]] = await getDbBackup(dbsToExport[i]);
    }

    await createFile(electronService, exported, `export_${toDateString(new Date())}.json`);

    return exported;
}

async function getDbBackup(dbName: string): Promise<P.DatabaseBackup> {
    const db = await getDatabase(dbName);
    return { db: dbName, data: await db.allDocs({ include_docs: true }) };
}

async function createFile(electronService: ElectronService, content: any, fileName: string) {
    return saveFile(electronService, JSON.stringify(content), fileName);
}

async function saveFile(electronService: ElectronService, content: string, fileName: string, targetPath?: string) {
    return new Promise((resolve, reject) => {
        if (electronService.isElectronApp) {
            const saveResult = electronService.ipcRenderer.sendSync('save-file', {
                content,
                type: 'application/json',
                fileName,
                targetPath,
            });
            if (saveResult.state !== 1) {
                reject(saveResult.error || 'Es wurde kein Exportpfad ausgewählt');
            } else {
                resolve();
            }
        } else {
            FileSaver.saveAs(new Blob([content], { type: 'application/json' }), fileName);
            resolve();
        }
    });
}

function toDateString(date: Date) {
    return (
        date.getUTCFullYear() +
        '-' +
        (date.getUTCMonth() + 1).toString().padStart(2, '0') +
        '-' +
        date
            .getUTCDate()
            .toString()
            .padStart(2, '0')
    );
}
