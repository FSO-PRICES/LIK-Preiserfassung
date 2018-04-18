import { Observable } from 'rxjs/Observable';
import { first } from 'lodash';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';

import { Models as P } from 'lik-shared';

export const dbNames = {
    emptyDb: 'inexistant',
    users: '_users',
    warenkorb: 'warenkorb',
    preiserheber: 'preiserheber',
    preismeldestelle: 'preismeldestellen',
    region: 'regionen',
    preiszuweisung: 'preiszuweisungen',
    orphaned_erfasste_preismeldungen: 'orphaned_erfasste_preismeldungen',
    preismeldung: 'preismeldungen',
    setting: 'settings',
    import: 'imports',
    exports: 'exports',
    onoffline: 'onoffline',
};

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);
// PouchDB.debug.enable('pouchdb:api');
PouchDB.debug.enable('pouchdb:http');

export const checkIfDatabaseExists = dbName => _checkIfDatabaseExists(dbName);

export function getDatabase(dbName): Promise<PouchDB.Database<{}>> {
    return getCouchDb(dbName);
}

export const getDatabaseAsObservable = (dbName: string) => Observable.fromPromise(getDatabase(dbName));

export function getLocalDatabase(dbName) {
    return getLocalCouchDb(dbName);
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
    return getLocalDatabase(dbNames.setting).then(db =>
        db.allDocs(Object.assign({}, { include_docs: true })).then(res => first(res.rows.map(y => y.doc)) as P.Setting)
    );
}

function getCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
    return getSettings()
        .then(settings => {
            const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
            return Promise.resolve(couch);
        })
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
