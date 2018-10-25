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

import { Observable } from 'rxjs/Observable';
import { first } from 'lodash';
import * as bluebird from 'bluebird';

import { Models as P } from 'lik-shared';

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
};

export const systemDbNames: [keyof typeof dbNames] = [
    'warenkorb',
    'preiserheber',
    'preismeldestellen',
    'preiszuweisungen',
    'orphaned_erfasste_preismeldungen',
    'preismeldungen',
    'preismeldungen_status',
    'imports',
    'exports',
];

export const monthlyDbs: [keyof typeof dbNames] = ['preismeldungen_status', 'exports'];

export const checkIfDatabaseExists = dbName => _checkIfDatabaseExists(dbName);

export function getDatabase(dbName): Promise<PouchDB.Database<{}>> {
    return getCouchDb(dbName);
}

export const getDatabaseAsObservable = (dbName: string) => Observable.fromPromise(getDatabase(dbName));

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

async function _syncDatabaseAsync(dbName: string, params: { push: boolean; pull: boolean }, batchSize: number = 1000) {
    const pouchDb = await getLocalCouchDb(dbName);
    const couchDb = await getCouchDb(dbName);
    const sync = pouchDb.sync(couchDb, { ...params, batch_size: batchSize });
    return new Promise((resolve, reject) => {
        sync.on('complete', info => resolve(info));
        sync.on('error', error => reject(error));
    });
}

export function dropLocalDatabase(dbName) {
    return getLocalCouchDb(dbName).then(db =>
        db
            .destroy()
            .then(() => true)
            .catch(() => false)
    );
}

export function dropRemoteCouchDatabase(dbName) {
    return getCouchDb(dbName).then(db =>
        db
            .destroy()
            .then(() => true)
            .catch(() => false)
    );
}

export async function dropMonthlyDatabases() {
    return bluebird.map(
        [getLocalCouchDb(dbNames.preismeldungen_status)].concat(monthlyDbs.map(dbName => getCouchDb(dbName))),
        db => db.destroy()
    );
}

export function dropRemoteCouchDatabaseAndSyncLocalToRemote(dbName: string) {
    return dropRemoteCouchDatabase(dbName).then(() => {
        return getSettings().then(settings => {
            console.log('DEBUG: SETTINGS:', settings);
            const pouch = new PouchDB(`${dbName}`);
            const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
            return pouch.sync(couch, { push: true, pull: false, batch_size: 1000 }).then(() => true);
        });
    });
}

export function listAllDatabases() {
    return Observable.fromPromise(getSettings()).flatMap(settings =>
        Observable.ajax({
            url: `${settings.serverConnection.url}/_all_dbs`,
            headers: { 'Content-Type': 'application/json' },
            crossDomain: true,
            withCredentials: true,
            responseType: 'json',
            method: 'GET',
        })
            .map(x => x.response as string[])
            .catch(error => Observable.of(<string[]>[]))
    );
}

export function getSettings() {
    return getLocalDatabase(dbNames.settings).then(db =>
        db.allDocs(Object.assign({}, { include_docs: true })).then(res => first(res.rows.map(y => y.doc)) as P.Setting)
    );
}

function getCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
    return getSettings()
        .then(settings => new PouchDB(`${settings.serverConnection.url}/${dbName}`))
        .catch(err => new PouchDB(dbNames.emptyDb));
}

function getLocalCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
    return Promise.resolve(new PouchDB(dbName));
}

function _checkIfDatabaseExists(dbName) {
    return getDatabase(dbName)
        .then(() => true)
        .catch(() => false);
}
