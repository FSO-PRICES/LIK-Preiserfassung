import * as bluebird from 'bluebird';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';
import { first } from 'lodash';
import * as xhr from 'xhr';

import { Models as P } from 'lik-shared';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

export const dbNames = {
    emptyDb: 'inexistant',
    users: '_users',
    warenkorb: 'warenkorb',
    preiserheber: 'preiserheber',
    preismeldestelle: 'preismeldestellen',
    region: 'regionen',
    preiszuweisung: 'preiszuweisungen',
    preismeldung: 'preismeldungen',
    setting: 'settings',
    import: 'imports'
};

dropLocalDatabase(dbNames.emptyDb);

export function createUser(username: string, password: string) {
    return getDatabase('_users').then((db: any) => db.signUp(username, password));
}

export function putAdminUserToDatabase(dbName, username: string) {
    return putUserToDatabase(dbName, { members: { names: [username] } });
}

export function putUserToDatabase(dbName, users: P.CouchSecurity) {
    const put$ = Observable.bindNodeCallback<string, any, XMLHttpRequest>(xhr.put);
    return Observable.fromPromise(
        getSettings().then(settings => {
            return put$(`${settings.serverConnection.url}${dbName}/_security`, {
                body: users,
                json: true,
                withCredentials: true,
                headers: {
                    // TODO: Add cookie authentication
                    'Content-Type': 'application/json'
                }
            });
        }).catch(err => Observable.from([]))
    ).flatMap(x => x);
}

export function getDatabase(dbName): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getCouchDb(dbName);
}

export function getLocalDatabase(dbName) {
    return getLocalCouchDb(dbName);
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`
    };
}

export const checkIfDatabaseExists = (dbName) => _checkIfDatabaseExists(dbName);

export function dropDatabase(dbName) {
    return getCouchDb(dbName).then(db => db.destroy().then(() => true).catch(() => false));
}

export function dropLocalDatabase(dbName) {
    return getLocalCouchDb(dbName).then(db => db.destroy().then(() => true).catch(() => false));
}

function getCouchDb(dbName: string): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getSettings().then(settings => {
        const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
        return Promise.resolve(couch);
    }).catch(err => new PouchDB(dbNames.emptyDb));
}

function getLocalCouchDb(dbName: string): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return Promise.resolve(new PouchDB(dbName));
}

export function syncDb(dbName: string) {
    return dropDatabase(dbName).then(() => {
        return getSettings().then(settings => {
            const pouch = new PouchDB(`${dbName}`);
            const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);

            return pouch.sync(couch, { push: true, pull: false, batch_size: 1000 }).then(() => true).catch(() => true);
        });
    }).catch(err => new PouchDB(dbNames.emptyDb));
}

function _checkIfDatabaseExists(dbName) {
    return getDatabase(dbName).then(() => true).catch(() => false);
}

export function getSettings() {
    return getLocalDatabase(dbNames.setting).then(db => db.allDocs(Object.assign({}, { include_docs: true })).then(res => first(res.rows.map(y => y.doc)) as P.Setting));
}


export function isLoginExpired(expirationTime: number) {
    const lastLoginTime = localStorage.getItem('couchdb_lastLoginTime');
    return true || !lastLoginTime || (+ new Date()) > parseInt(lastLoginTime, 10) + expirationTime;
}

function setCouchLoginTime(timestamp: number) {
    return localStorage.setItem('couchdb_lastLoginTime', timestamp.toString());
}

export function loginToDatabase(credentials: { username: string, password: string }): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getSettings().then(settings => {
        const couch = new PouchDB(`${settings.serverConnection.url}/${dbNames.users}`);
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        return login(credentials.username, credentials.password).then(x => {
            setCouchLoginTime(+ new Date());
            return couch;
        }) as any;
    });
}
