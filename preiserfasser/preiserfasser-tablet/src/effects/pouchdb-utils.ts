import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { assign } from 'lodash';
import { format } from 'date-fns';

import { Models as P, parseDate } from 'lik-shared';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

const DB_NAME = 'lik';

function _checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any).allDbs().then((dbnames: string[]) => (dbnames || []).find(x => x === dbName));
}

export function getOrCreateDatabase() {
    return Promise.resolve(new PouchDB(DB_NAME));
}

export const getOrCreateDatabaseAsObservable = () => Observable.fromPromise(getOrCreateDatabase());

export function getDatabase(): Promise<PouchDB.Database<{}>> {
    return _checkIfDatabaseExists(DB_NAME).then(exists => new PouchDB(DB_NAME));
}

export const getDatabaseAsObservable = () => Observable.fromPromise(getDatabase());

export function getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
    return db.get(key).then((doc: any) => doc as T);
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`,
    };
}

export function getAllDocumentsForPrefixFromDb(db: PouchDB.Database<{}>, prefix: string) {
    return db
        .allDocs(assign({}, { include_docs: true }, getAllDocumentsForPrefix(prefix)))
        .then(x => x.rows.map(row => row.doc));
}

export const checkIfDatabaseExists = (): Promise<boolean> =>
    _checkIfDatabaseExists(DB_NAME).then(exists => {
        if (!exists) return Promise.resolve(false);
        return getOrCreateDatabase()
            .then(db =>
                db
                    .get('db-schema-version')
                    .catch(() => ({ version: null }))
                    .then((doc: P.DbSchemaVersion) => doc.version)
            )
            .then(version => version === P.ExpectedDbSchemaVersion);
    });

export function checkConnectivity(url) {
    return Observable.ajax({
        url,
        headers: { 'Content-Type': 'application/json' },
        crossDomain: true,
        withCredentials: true,
        responseType: 'json',
        method: 'GET',
        timeout: 1000,
    }).map(resp => resp.response['version'] === '1.6.1');
}

export function dropDatabase() {
    const db = new PouchDB(DB_NAME);
    return db
        .destroy()
        .then(() => {})
        .catch(() => {}); // Always try to delete, because the checkIfDatabaseExists could return a false negative
}

export function downloadDatabase(data: { url: string; username: string }) {
    return _syncDatabase(data.url, data.username, { push: false, pull: true });
}

export function uploadDatabase(data: { url: string; username: string }) {
    return _syncDatabase(data.url, data.username, { push: true, pull: false });
}

export function syncDatabase(data: { url: string; username: string }) {
    return _syncDatabase(data.url, data.username, { push: true, pull: true });
}

function _syncDatabase(url: string, username: string, params: { push: boolean; pull: boolean }): Observable<{}> {
    const ts = new Date().valueOf();
    return getDatabaseAsObservable()
        .flatMap(pouch => {
            const couchOnOffline = new PouchDB(`${url}/onoffline`, { skip_setup: true }) as PouchDB.Database<{}>;
            const couch = new PouchDB(`${url}/user_${username}`, { skip_setup: true }) as PouchDB.Database<{}>;
            return getDocumentByKeyFromDb<P.OnOfflineStatus>(couchOnOffline, 'onoffline_status')
                .then(onofflineStatus => {
                    if (onofflineStatus.isOffline) throw 'DB OFFLINE';
                })
                .then(() =>
                    getDocumentByKeyFromDb(pouch, 'user-db-id')
                        .catch(() => ({ value: 'pouchUserDbId-not-found' }))
                        .then((pouchDoc: any) =>
                            getDocumentByKeyFromDb(couch, 'user-db-id').then((couchDoc: any) => ({
                                couchUserDbId: couchDoc.value,
                                pouchUserDbId: pouchDoc.value,
                                pouch,
                                couch,
                            }))
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ monthAsString: string }>(pouch, 'erhebungsmonat')
                                .catch(() => ({ monthAsString: null }))
                                .then(({ monthAsString }) => assign(x, { pouchErhebungsmonat: monthAsString }))
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ monthAsString: string }>(couch, 'erhebungsmonat').then(
                                ({ monthAsString }) => assign(x, { couchErhebungsmonat: monthAsString })
                            )
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ username: string }>(pouch, 'preiserheber')
                                .catch(() => ({ username: null }))
                                .then(({ username }) => assign(x, { username }))
                        )
                );
        })
        .flatMap(
            ({ pouchUserDbId, couchUserDbId, pouch, couch, pouchErhebungsmonat, couchErhebungsmonat, username }) => {
                if (couchErhebungsmonat !== pouchErhebungsmonat) {
                    if (!pouchErhebungsmonat) {
                        return Observable.from(pouch.destroy())
                            .flatMap(() => getDatabaseAsObservable())
                            .map(newPouch => ({ couch, pouch: newPouch }));
                    }
                    return backupDatabase(pouch, `lik_${pouchErhebungsmonat}_${format(new Date(), 'YYYYMMDDTHHmmss')}`)
                        .flatMap(() => Observable.from(pouch.destroy()))
                        .flatMap(() => getDatabaseAsObservable())
                        .map(newPouch => ({ couch, pouch: newPouch }));
                }
                if (pouchUserDbId === couchUserDbId || pouchUserDbId === 'pouchUserDbId-not-found') {
                    return Observable.of({ doSync: true, pouch, couch });
                }
                return Observable.throw('error_user-db-id-mismatch');
            }
        )
        .flatMap(({ couch, pouch }) => {
            const sync = pouch.sync(couch, { push: params.push, pull: params.pull, batch_size: 1000 });

            return Observable.create((observer: Observer<{}>) => {
                sync.on('complete', info => {
                    observer.next({});
                    observer.complete();
                });
                sync.on('error', error => observer.error(error));
            });
        });
}

function backupDatabase(db: PouchDB.Database<{}>, newDatabaseName) {
    return Observable.create((observer: Observer<{}>) => {
        db.replicate.to(new PouchDB(newDatabaseName)).on('complete', () => {
            observer.next(null);
            observer.complete();
        });
    });
}

export function getLoggedInUser(url: string, username: string) {
    return getDatabaseAsObservable().flatMap(pouch => {
        const db = new PouchDB(`${url}/user_${username}`, { skip_setup: true }) as PouchDB.Database<{}>;
        return Observable.fromPromise(
            db
                .get('preiserheber')
                .then((doc: any) => doc.username)
                .catch(() => null)
        );
    });
}

export function loginIntoDatabase(data: { url: string; username: string; password: string }) {
    return getOrCreateDatabaseAsObservable().flatMap(pouch => {
        const couch = new PouchDB(`${data.url}/user_${data.username}`, { skip_setup: true }) as any;
        const login = Observable.bindNodeCallback<string, string, string>(couch.login.bind(couch));
        return login(data.username, data.password);
    });
}

export function initialisePouchForDev() {
    (window as any).PouchDB = PouchDB;
    (PouchDB as any).debug.enable('pouchdb:http');
}
