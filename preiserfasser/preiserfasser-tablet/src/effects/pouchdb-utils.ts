import * as PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';
import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

const DB_NAME = 'lik';

function _checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any).allDbs()
        .then((dbnames: string[]) => (dbnames || []).find(x => x === dbName));
}

export function getOrCreateDatabase() {
    return Promise.resolve(new PouchDB(DB_NAME));
}

export const getOrCreateDatabaseAsObservable = () => Observable.fromPromise(getOrCreateDatabase());

export function getDatabase(): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return _checkIfDatabaseExists(DB_NAME)
        .then(exists => new PouchDB(DB_NAME));
}

export const getDatabaseAsObservable = () => Observable.fromPromise(getDatabase());

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}/`,
        endkey: `${prefix}/\uffff`
    };
}

export function getAllDocumentsForPrefixFromDb(db: PouchDB.Database<PouchDB.Core.Encodable>, prefix: string) {
    return db.allDocs(assign({}, { include_docs: true }, getAllDocumentsForPrefix(prefix))).then(x => x.rows.map(row => row.doc));
}

export const checkIfDatabaseExists = (): Promise<boolean> =>
    _checkIfDatabaseExists(DB_NAME)
        .then(exists => {
            if (!exists) return Promise.resolve(false);
            return getOrCreateDatabase()
                .then(db => db.get('db-schema-version').catch(() => ({ version: null })).then((doc: P.DbSchemaVersion) => doc.version))
                .then(version => version === P.ExpectedDbSchemaVersion);
        });

export function checkConnectivity(url) {
    return Observable
        .ajax({
            url,
            headers: { 'Content-Type': 'application/json' },
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
    return getOrCreateDatabaseAsObservable()
        .flatMap(pouch => {
            const couch = new PouchDB(`${data.url}/user_${data.username}`) as any;
            const login = Observable.bindNodeCallback<string, string, string>(couch.login.bind(couch));
            return login(data.username, data.password).map(() => ({ pouch, couch }));
        })
        .flatMap(({ pouch, couch }) => {
            const sync = Observable.bindNodeCallback<any, any, any>(pouch.sync.bind(pouch));
            return sync(couch, { push: false, pull: true, batch_size: 1000 });
        });
}

export function uploadDatabase(data: { url: string, username: string, password: string }) {
    return getDatabaseAsObservable()
        .flatMap(pouch => {
            const couch = new PouchDB(`${data.url}/user_${data.username}`) as any;
            const login = Observable.bindNodeCallback<string, string, string>(couch.login.bind(couch));
            return login(data.username, data.password).map(() => ({ pouch, couch }));
        })
        .flatMap(x => x.pouch.compact().then(() => x))
        .flatMap(({ pouch, couch }) => {
            const sync = Observable.bindNodeCallback<any, any, any>(pouch.sync.bind(pouch));
            return sync(couch, { push: true, pull: false, batch_size: 1000 });
        });
}

export function initialisePouchForDev() {
    (window as any).PouchDB = PouchDB;
    (PouchDB as any).debug.enable('pouchdb:http');
}
