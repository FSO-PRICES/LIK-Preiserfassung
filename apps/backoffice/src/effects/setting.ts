import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as FileSaver from 'file-saver';
import { ElectronService } from 'ngx-electron';
import { flatMap, map, switchMap, withLatestFrom } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import * as setting from '../actions/setting';
import { continueEffectOnlyIfTrue } from '../common/effects-extensions';
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
    isLoggedIn$ = this.store.select(fromRoot.getIsLoggedIn);

    constructor(
        private actions$: Actions,
        private store: Store<fromRoot.AppState>,
        private electronService: ElectronService,
    ) {}

    @Effect()
    loadSetting$ = this.actions$.ofType('SETTING_LOAD').pipe(
        flatMap(() => getSettings()),
        map(docs =>
            !!docs
                ? ({ type: 'SETTING_LOAD_SUCCESS', payload: docs } as setting.Action)
                : ({ type: 'SETTING_LOAD_FAIL' } as setting.Action),
        ),
    );

    @Effect()
    saveSetting$ = this.actions$.ofType('SAVE_SETTING').pipe(
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
                        transportRequestSettings: currentSetting.transportRequestSettings,
                        export: currentSetting.export,
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
    exportDbs$ = this.actions$.ofType('EXPORT_DATABASES').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
        switchMap(() => createDbBackups(this.electronService)),
        map(payload => ({ type: 'EXPORT_DATABASES_SUCCESS', payload } as setting.Action)),
    );

    @Effect()
    importDb$ = this.actions$.ofType('IMPORT_DATABASE').pipe(
        continueEffectOnlyIfTrue(this.isLoggedIn$),
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

    await createFile(electronService, exported, `export_${new Date().toISOString()}.json`);

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
