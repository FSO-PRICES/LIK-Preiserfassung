import * as bluebird from 'bluebird';
import { first } from 'lodash';
import { from, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { fromFetch } from 'rxjs/fetch';
import { catchError, flatMap, map, switchMap } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import PouchDB from './pouchdb';

export const dbNames = {
    emptyDb: 'inexistant',
    users: '_users',
    warenkorb: 'warenkorb',
    preiserheber: 'preiserheber',
    preismeldestellen: 'preismeldestellen',
    regionen: 'regionen',
    preiszuweisungen: 'preiszuweisungen',
    orphaned_erfasste_preismeldungen: 'orphaned_erfasste_preismeldungen',
    preismeldungen: 'preismeldungen',
    preismeldungen_status: 'preismeldungen_status',
    settings: 'settings',
    imports: 'imports',
    exports: 'exports',
    onoffline: 'onoffline',
    sedex: 'sedex',
};

type DbNames = keyof typeof dbNames;

export const systemDbNames: DbNames[] = [
    'warenkorb',
    'preiserheber',
    'preismeldestellen',
    'preiszuweisungen',
    'orphaned_erfasste_preismeldungen',
    'preismeldungen',
    'preismeldungen_status',
    'imports',
    'exports',
    'sedex',
];

export const monthlyDbs: DbNames[] = ['preismeldungen_status', 'exports'];

export const checkIfDatabaseExists = (dbName: string) => _checkIfDatabaseExists(dbName);

export function getDatabase(
    dbName: string,
    config: PouchDB.Configuration.DatabaseConfiguration = null,
): Promise<PouchDB.Database<{}>> {
    return getCouchDb(dbName, config);
}

export function checkConnectivity(url: string) {
    return fromFetch(url).pipe(
        switchMap((response) => {
            if (response.ok) {
                return response.json();
            } else {
                return of({ error: true, response });
            }
        }),
        map((response) => {
            if (response.error) {
                console.error('Error in the response of checkConnectivity()', response);
                return false;
            }

            if (response['version'].indexOf('3.2') === 0 || response['version'].indexOf('3.3') === 0) {
                return true;
            } else {
                console.error('The Version of CouchDB is not compatible with your Application');
                return false;
            }
        }),
        catchError((e) => {
            console.error('Error from checkConnectivity()', e);
            return of(false);
        }),
    );
}

export const getDatabaseAsObservable = (dbName: string) => from(getDatabase(dbName));

export function getLocalDatabase(dbName) {
    return getLocalCouchDb(dbName);
}

export async function downloadDatabaseAsync(dbName: string) {
    return _syncDatabaseAsync(dbName, { push: false, pull: true });
}

export async function uploadDatabaseAsync(dbName: string) {
    return _syncDatabaseAsync(dbName, { push: true, pull: false });
}

export async function syncDatabaseAsync(dbName: string) {
    return _syncDatabaseAsync(dbName, { push: true, pull: true });
}

async function _syncDatabaseAsync(dbName: string, params: { push: any; pull: any }, batchSize = 1000) {
    const pouchDb = await getLocalCouchDb(dbName);
    const couchDb = await getCouchDb(dbName);
    const sync = pouchDb.sync(couchDb, { ...params, batch_size: batchSize });

    return new Promise((resolve, reject) => {
        sync.on('complete', (info) => resolve(info));
        sync.on('error', (error) => reject(error));
    });
}

export function dropLocalDatabase(dbName) {
    return getLocalCouchDb(dbName).then((db) =>
        db
            .destroy()
            .then(() => true)
            .catch(() => false),
    );
}

export function dropRemoteCouchDatabase(dbName) {
    return getCouchDb(dbName).then((db) =>
        db
            .destroy()
            .then(() => true)
            .catch(() => false),
    );
}

export async function dropMonthlyDatabases() {
    return bluebird.map(
        [getLocalCouchDb(dbNames.preismeldungen_status)].concat(monthlyDbs.map((dbName) => getCouchDb(dbName))),
        (db) => db.destroy(),
    );
}

export function dropRemoteCouchDatabaseAndSyncLocalToRemote(dbName: string) {
    return dropRemoteCouchDatabase(dbName).then(() => {
        return getSettings().then((settings) => {
            const pouch = new PouchDB(`${dbName}`);
            const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`, {
                ajax: { timeout: 50000 },
            } as any);
            return pouch.sync(couch, { push: true as any, pull: false as any, batch_size: 1000 }).then(() => true);
        });
    });
}

export function listAllDatabases() {
    return from(getSettings()).pipe(
        flatMap((settings) =>
            ajax({
                url: `${settings.serverConnection.url}/_all_dbs`,
                headers: { 'Content-Type': 'application/json' },
                crossDomain: true,
                withCredentials: true,
                responseType: 'json',
                method: 'GET',
                timeout: 50000,
            }).pipe(
                map((x) => x.response as string[]),
                catchError(() => of(<string[]>[])),
            ),
        ),
    );
}

export function getSettings() {
    return getLocalDatabase(dbNames.settings).then((db) =>
        db
            .allDocs(Object.assign({}, { include_docs: true }))
            .then((res) => first(res.rows.map((y) => y.doc)) as P.Setting),
    );
}

function getCouchDb(
    dbName: string,
    config: PouchDB.Configuration.DatabaseConfiguration = null,
): Promise<PouchDB.Database<{}>> {
    const ajaxOptions = {
        ajax: { timeout: 50000 },
    } as any;
    return getSettings()
        .then(
            (settings) =>
                new PouchDB(
                    `${settings.serverConnection.url}/${dbName}`,
                    config ? { ...config, ...ajaxOptions } : ajaxOptions,
                ),
        )
        .catch(() => new PouchDB(dbNames.emptyDb));
}

function getLocalCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
    return Promise.resolve(new PouchDB(dbName));
}

function _checkIfDatabaseExists(dbName: string) {
    return getDatabase(dbName, { skip_setup: true })
        .then((db) => db.info())
        .then(() => true)
        .catch(() => false);
}
