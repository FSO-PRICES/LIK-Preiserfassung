import * as bluebird from 'bluebird';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { environment } from '../environments/environment';
import { Http, Headers } from '@angular/http';
import { Models as P } from 'lik-shared';

const couchDbUrl = environment.couchSettings.url;
const USERNAME = environment.couchSettings.adminUsername;
const PASSWORD = environment.couchSettings.adminPassword;

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);


export function createUser(username: string, password: string) {
    return getDatabase('_users').then((db: any) => db.signUp(username, password));
}


export function putAdminUserToDatabase(http: Http, dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) {
    return putUserToDatabase(http, dbName, { members: { names: [USERNAME] } }, credentials);
}

export function putUserToDatabase(http: Http, dbName, users: P.CouchSecurity, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) {
    let headers = new Headers();
    headers.append('Authorization', `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`);
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return http.put(`${couchDbUrl}${dbName}/_security`, users, { headers: headers });
}

export function getDatabase(dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getCouchDb(dbName, credentials);
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

export const checkIfDatabaseExists = (dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) => _checkIfDatabaseExists(dbName, credentials);

export function dropDatabase(dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) {
    return getCouchDb(dbName, credentials).then(db => db.destroy().then(() => true).catch(() => false));
}

export function dropLocalDatabase(dbName) {
    return getLocalCouchDb(dbName).then(db => db.destroy().then(() => true).catch(() => false));
}

function getCouchDb(dbName: string, credentials: { username: string, password: string }): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    const couch = new PouchDB(`${couchDbUrl}${dbName}`);
    const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

    return login(credentials.username, credentials.password).then(x => couch) as any;
}

function getLocalCouchDb(dbName: string): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return Promise.resolve(new PouchDB(dbName));
}

export function syncDb(dbName: string, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) {
    return dropDatabase(dbName, credentials).then(() => {
        const pouch = new PouchDB(`${dbName}`);
        const couch = new PouchDB(`${couchDbUrl}${dbName}`);
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        return login(credentials.username, credentials.password).then(x => pouch.sync(couch, { push: true, pull: false, batch_size: 1000 }).then(() => true).catch(() => true));
    });
}

function _checkIfDatabaseExists(dbName, credentials) {
    return getDatabase(dbName, credentials).then(() => true).catch(() => false);
}
