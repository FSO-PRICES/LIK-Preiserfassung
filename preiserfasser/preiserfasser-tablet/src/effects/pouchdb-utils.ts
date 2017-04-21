import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

const DB_NAME = 'lik';

function _checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any).allDbs()
        .then((dbs: string[]) => (dbs || []).some(x => x === dbName));
}

export function getOrCreateDatabase() {
    return Promise.resolve(new PouchDB(DB_NAME));
}

export function getDatabase(): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return _checkIfDatabaseExists(DB_NAME)
        .then(exists => {
            if (!exists) throw new Error(`Database 'lik' does not exist`);
            return new PouchDB(DB_NAME);
        });
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}/`,
        endkey: `${prefix}/\uffff`
    };
}

export const checkIfDatabaseExists = () => _checkIfDatabaseExists(DB_NAME);

export function checkConnectivity(url) {
    return Observable.ajax({
        url,
        headers: {
            'Content-Type': 'application/json'
        },
        crossDomain: true,
        withCredentials: true,
        responseType: 'json',
        method: 'GET',
        timeout: 1000
    })
        .map(resp => resp.response['version'] === '1.6.1');
}

export function dropDatabase() {
    const db = new PouchDB(DB_NAME);
    return db.destroy().then(() => { }).catch(() => { }); // Always try to delete, because the checkIfDatabaseExists could return a false negative
}

export function downloadDatabase(data: { url: string, username: string, password: string }) {
    return getOrCreateDatabase()
        .then(pouch => {
            const couch = new PouchDB(`${data.url}/user_${data.username}`) as any;
            const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

            return login(data.username, data.password)
                .then(() => {
                    const sync = bluebird.promisify<any, any, any>(pouch.sync, { context: pouch });
                    return sync(couch, { push: false, pull: true, batch_size: 1000 });
                });
        });
}

export function uploadDatabase(data: { url: string, username: string, password: string }) {
    return getDatabase()
        .then(pouch => {
            const couch = new PouchDB(`${data.url}/user_${data.username}`) as any;
            const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

            return login(data.username, data.password)
                .then(() => {
                    const sync = bluebird.promisify<any, any, any>(pouch.sync, { context: pouch });
                    return pouch.compact().then(() => sync(couch, { push: true, pull: false, batch_size: 1000 }));
                });
        });
}

export function initialisePouchForDev() {
    (window as any).PouchDB = PouchDB;
    (PouchDB as any).debug.enable('pouchdb:http');
}
