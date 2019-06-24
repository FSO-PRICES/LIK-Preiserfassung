import { format } from 'date-fns';
import { assign } from 'lodash';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { bindNodeCallback, from } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs';
import { Observer } from 'rxjs/Observer';
import { flatMap, map } from 'rxjs/operators';

import { Models as P } from 'lik-shared';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

export const DB_NAME = 'lik';

function _checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any).allDbs().then((dbnames: string[]) => (dbnames || []).find(x => x === dbName));
}

export function getOrCreateDatabase() {
    return Promise.resolve(new PouchDB(DB_NAME));
}

export const getOrCreateDatabaseAsObservable = () => from(getOrCreateDatabase());

export function getDatabase(): Promise<PouchDB.Database<{}>> {
    return _checkIfDatabaseExists(DB_NAME).then(exists => new PouchDB(DB_NAME));
}

export const getDatabaseAsObservable = () => from(getDatabase());

export function getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
    return db.get(key).then((doc: any) => doc as T);
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`,
    };
}

export function getAllDocumentsForPrefixFromDb<T>(db: PouchDB.Database<{}>, prefix: string) {
    return db
        .allDocs(assign({}, { include_docs: true }, getAllDocumentsForPrefix(prefix)))
        .then(x => x.rows.map((row: any) => row.doc as T));
}

export function getDocumentWithFallback<T>(db: PouchDB.Database<{}>, id: string, fallback: T = null) {
    return db.get(id).catch(err => fallback);
}

export const checkIfDatabaseExists = (): Promise<boolean> =>
    _checkIfDatabaseExists(DB_NAME).then(exists => {
        if (!exists) return Promise.resolve(false);
        return getOrCreateDatabase()
            .then(db =>
                db
                    .get('db-schema-version')
                    .catch(() => ({ version: null }))
                    .then((doc: P.DbSchemaVersion) => doc.version),
            )
            .then(version => version === P.ExpectedDbSchemaVersion);
    });

export function checkConnectivity(url) {
    return ajax({
        url,
        headers: { 'Content-Type': 'application/json' },
        crossDomain: true,
        withCredentials: true,
        responseType: 'json',
        method: 'GET',
        timeout: 1000,
    }).pipe(
        map(
            resp =>
                resp.response['version'] === '1.6.1' ||
                resp.response['version'].indexOf('2.1') === 0 ||
                resp.response['version'].indexOf('2.3') === 0,
        ),
    );
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
    return getDatabaseAsObservable().pipe(
        flatMap(pouch => {
            const couchOnOffline = new PouchDB(`${url}/onoffline`, { skip_setup: true }) as PouchDB.Database<{}>;
            const couch = new PouchDB(`${url}/user_${username}`, { skip_setup: true }) as PouchDB.Database<{}>;
            return getDocumentByKeyFromDb<P.OnOfflineStatus>(couchOnOffline, 'onoffline_status')
                .then(onofflineStatus => {
                    if (onofflineStatus.isOffline) throw new Error('DB OFFLINE');
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
                            })),
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ monthAsString: string }>(pouch, 'erhebungsmonat')
                                .catch(() => ({ monthAsString: null }))
                                .then(({ monthAsString }) => assign(x, { pouchErhebungsmonat: monthAsString })),
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ monthAsString: string }>(couch, 'erhebungsmonat').then(
                                ({ monthAsString }) => assign(x, { couchErhebungsmonat: monthAsString }),
                            ),
                        )
                        .then(x =>
                            getDocumentByKeyFromDb<{ username: string }>(pouch, 'preiserheber')
                                .catch(() => ({ username: null }))
                                .then(({ username }) => assign(x, { username })),
                        ),
                );
        }),
        flatMap(({ pouchUserDbId, couchUserDbId, pouch, couch, pouchErhebungsmonat, couchErhebungsmonat }) => {
            if (couchErhebungsmonat !== pouchErhebungsmonat) {
                if (!pouchErhebungsmonat) {
                    return from(pouch.destroy()).pipe(
                        flatMap(() => getDatabaseAsObservable()),
                        map(newPouch => ({ couch, pouch: newPouch })),
                    );
                }
                return (
                    backupDatabase(pouch, `lik_${pouchErhebungsmonat}_${format(new Date(), 'YYYYMMDDTHHmmss')}`),
                    flatMap(() => from(pouch.destroy())),
                    flatMap(() => getDatabaseAsObservable()),
                    map(newPouch => ({ couch, pouch: newPouch }))
                );
            }
            if (pouchUserDbId === couchUserDbId || pouchUserDbId === 'pouchUserDbId-not-found') {
                return of({ doSync: true, pouch, couch });
            }
            return Observable.throw('error_user-db-id-mismatch');
        }),
        flatMap(({ couch, pouch }) => {
            // TODO Test if pull/push config still works
            const sync = pouch.sync(couch, { push: params.push as any, pull: params.pull as any, batch_size: 1000 });

            return Observable.create((observer: Observer<{}>) => {
                sync.on('complete', info => {
                    observer.next({});
                    observer.complete();
                });
                sync.on('error', error => observer.error(error));
            });
        }),
    );
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
    return getDatabaseAsObservable().pipe(
        flatMap(pouch => {
            const db = new PouchDB(`${url}/user_${username}`, { skip_setup: true }) as PouchDB.Database<{}>;
            return from(
                db
                    .get('preiserheber')
                    .then((doc: any) => doc.username)
                    .catch(() => null),
            );
        }),
    );
}

export function loginIntoDatabase(data: { url: string; username: string; password: string }) {
    return getOrCreateDatabaseAsObservable().pipe(
        flatMap(pouch => {
            const couch = new PouchDB(`${data.url}/user_${data.username}`, { skip_setup: true }) as any;
            const login = bindNodeCallback(couch.login.bind(couch));
            return login(data.username, data.password);
        }),
    );
}

export function initialisePouchForDev() {
    (window as any).PouchDB = PouchDB;
    (PouchDB as any).debug.enable('pouchdb:http');
}
