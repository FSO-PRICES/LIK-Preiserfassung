import * as bluebird from 'bluebird';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';
import { first, assign } from 'lodash';

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
    orphaned_erfasste_preismeldungen: 'orphaned_erfasste_preismeldungen',
    preismeldung: 'preismeldungen',
    setting: 'settings',
    import: 'imports'
};

dropLocalDatabase(dbNames.emptyDb);

export function createOrUpdateUser(erheber: P.Erheber, password: string) {
    return getDatabaseAsObservable('_users')
        .flatMap(db => db.get(`org.couchdb.user:${erheber.username}`).then(() => true).catch(() => false).then(userExists => ({ db, userExists })))
        .flatMap(x => x.userExists ? updateUser(erheber, password) : createUser(erheber, password));
}

function createUser(erheber: P.Erheber, password: string) {
    return getDatabase('_users').then((db: any) => db.signUp(erheber._id, password));
}

export function updateUser(erheber: P.Erheber, password: string) {
    return getDatabase('_users').then((db: any) => {
        if (!!password) {
            return db.changePassword(erheber._id, password);
        }
        return Promise.resolve(true);
    });
}

export function deleteUser(username: string) {
    return getDatabase('_users').then((db: any) =>
        db.get(`org.couchdb.user:${username}`).then(doc => db.remove(doc))
    ).then(() => true).catch(() => false);
}

export function putAdminUserToDatabase(dbName, username: string) {
    return putUserToDatabase(dbName, { members: { names: [username] } });
}

export function putUserToDatabase(dbName, users: P.CouchSecurity) {
    return Observable.fromPromise(
        getSettings().then(settings => Observable.ajax({
            url: `${settings.serverConnection.url}/${dbName}/_security`,
            body: users,
            headers: { 'Content-Type': 'application/json' },
            crossDomain: true,
            withCredentials: true,
            responseType: 'json',
            method: 'PUT'
        }))
    ).flatMap(x => x);
}

export function getDatabase(dbName): Promise<PouchDB.Database<{}>> {
    return getCouchDb(dbName);
}

export const getDatabaseAsObservable = (dbName: string) => Observable.fromPromise(getDatabase(dbName));

export function getLocalDatabase(dbName) {
    return getLocalCouchDb(dbName);
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`
    };
}

export function getAllDocumentsFromDb<T extends P.CouchProperties>(db: PouchDB.Database<{}>): Promise<T[]> {
    return db.allDocs({ include_docs: true }).then(x => x.rows.map(row => row.doc as T));
}

export function getAllDocumentsForPrefixFromDb<T extends P.CouchProperties>(db: PouchDB.Database<{}>, prefix: string): Promise<T[]> {
    return db.allDocs(assign({}, { include_docs: true }, getAllDocumentsForPrefix(prefix))).then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
}

export function getAllIdRevsForPrefixFromDb(db: PouchDB.Database<{}>, prefix: string): Promise<P.CouchProperties[]> {
    return db.allDocs(getAllDocumentsForPrefix(prefix)).then(x => x.rows.map(row => ({ _id: row.id, _rev: row.value.rev })));
}

export function getAllDocumentsForKeysFromDb<T extends P.CouchProperties>(db: PouchDB.Database<{}>, keys: string[]): Promise<T[]> {
    return db.allDocs({ include_docs: true, keys }).then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
}

export function getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
    return db.get(key).then((doc: any) => doc as T);
}

export function clearRev<T>(o: any): T {
    return assign({}, o, { _rev: undefined }) as T;
}

export const checkIfDatabaseExists = (dbName) => _checkIfDatabaseExists(dbName);

export function dropDatabase(dbName) {
    return getCouchDb(dbName).then(db => db.destroy().then(() => true).catch(() => false));
}

export function dropLocalDatabase(dbName) {
    return getLocalCouchDb(dbName).then(db => db.destroy().then(() => true).catch(() => false));
}

function getCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
    return getSettings().then(settings => {
        const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
        return Promise.resolve(couch);
    }).catch(err => new PouchDB(dbNames.emptyDb));
}

function getLocalCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
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

export function loginToDatabase(credentials: { username: string, password: string }): Promise<PouchDB.Database<{}>> {
    return getSettings().then(settings => {
        const couch = new PouchDB(`${settings.serverConnection.url}/${dbNames.users}`);
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        return login(credentials.username, credentials.password).then(x => {
            setCouchLoginTime(+ new Date());
            return couch;
        }) as any;
    });
}

export function checkServerConnection() {
    return Observable.fromPromise(getSettings())
        .flatMap(settings => Observable.ajax({
            url: settings.serverConnection.url,
            method: 'GET',
            crossDomain: true
        }));
}

export function listAllDatabases() {
    return Observable.fromPromise(getSettings())
        .flatMap(settings => Observable
            .ajax({
                url: `${settings.serverConnection.url}/_all_dbs`,
                headers: { 'Content-Type': 'application/json' },
                crossDomain: true,
                withCredentials: true,
                responseType: 'json',
                method: 'GET'
            }).map(x => x.response as string[])
            .catch((error) => Observable.of(<string[]>[]))
        );
}

export function listUserDatabases() {
    return listAllDatabases()
        .map((dbs: string[]) => dbs.filter(n => n.startsWith('user_')));
}

export function getUserDatabaseName(preiserheberId: string) {
    return `user_${preiserheberId}`;
}
