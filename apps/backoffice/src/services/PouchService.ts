import { Injectable } from '@angular/core';
import { assign, first, keyBy, sortBy } from 'lodash';
import PouchDB from 'pouchdb';
import PouchDBAllDbs from 'pouchdb-all-dbs';
import pouchDbAuthentication from 'pouchdb-authentication';
import { from, Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, flatMap, map, reduce } from 'rxjs/operators';

import { Models as P, preismeldestelleId, preismeldungId, preismeldungRefId } from '@lik-shared';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

// TODO: Remove or update and replace all references to common\pouchdb-utils\*
@Injectable()
export class PouchService {
    public dbNames = {
        emptyDb: 'inexistant',
        users: '_users',
        warenkorb: 'warenkorb',
        preiserheber: 'preiserheber',
        preismeldestelle: 'preismeldestellen',
        region: 'regionen',
        preiszuweisung: 'preiszuweisungen',
        preismeldung: 'preismeldungen',
        setting: 'settings',
        import: 'imports',
    };

    constructor() {
        this.dropLocalDatabase(this.dbNames.emptyDb);
    }

    public createUser(erheber: P.Erheber, password: string) {
        return this.getDatabase('_users').then((db: any) => db.signUp(erheber._id, password));
    }

    public updateUser(erheber: P.Erheber, password: string) {
        return this.getDatabase('_users').then((db: any) => {
            if (!!password) {
                return db.changePassword(erheber._id, password);
            }
            return Promise.resolve(true);
        });
    }

    public deleteUser(username: string) {
        return this.getDatabase('_users')
            .then((db: any) => db.get(`org.couchdb.user:${username}`).then(doc => db.remove(doc)))
            .then(() => true)
            .catch(() => false);
    }

    public putAdminUserToDatabase(dbName, username: string) {
        return this.putUserToDatabase(dbName, { members: { names: [username] } });
    }

    public putUserToDatabase(dbName, users: P.CouchSecurity) {
        return from(
            this.getSettings().then(settings =>
                ajax({
                    url: `${settings.serverConnection.url}/${dbName}/_security`,
                    body: users,
                    headers: { 'Content-Type': 'application/json' },
                    crossDomain: true,
                    withCredentials: true,
                    responseType: 'json',
                    method: 'PUT',
                }),
            ),
        ).pipe(flatMap(x => x));
    }

    public getDatabase(dbName: string): Promise<PouchDB.Database<{}>> {
        return this.getCouchDb(dbName);
    }

    public getDatabaseAsObservable = (dbName: string) => from(this.getDatabase(dbName));

    public getLocalDatabase(dbName: string) {
        return this.getLocalCouchDb(dbName);
    }

    public getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
        return {
            startkey: `${prefix}`,
            endkey: `${prefix}\uffff`,
        };
    }

    public getAllDocumentsFromDb<T extends P.CouchProperties>(db: PouchDB.Database<{}>): Promise<T[]> {
        return db.allDocs({ include_docs: true }).then(x => x.rows.map(row => row.doc as T));
    }

    public getAllDocumentsForPrefixFromDb<T extends P.CouchProperties>(
        db: PouchDB.Database<{}>,
        prefix: string,
    ): Promise<T[]> {
        return db
            .allDocs(assign({}, { include_docs: true }, this.getAllDocumentsForPrefix(prefix)))
            .then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
    }

    public getAllDocumentsForPrefixFromDbName<T extends P.CouchProperties>(
        dbName: string,
        prefix: string,
    ): Observable<T[]> {
        return this.getDatabaseAsObservable(dbName).pipe(
            flatMap(db => this.getAllDocumentsForPrefixFromDb<T>(db, prefix)),
        );
    }

    public getAllDocumentsForKeysFromDb<T extends P.CouchProperties>(
        db: PouchDB.Database<{}>,
        keys: string[],
    ): Promise<T[]> {
        return db.allDocs({ include_docs: true, keys }).then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
    }

    public getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
        return db.get(key).then((doc: any) => doc as T);
    }

    public clearRev<T>(o: any): T {
        return assign({}, o, { _rev: undefined }) as T;
    }

    public checkIfDatabaseExists = (dbName: string) => this._checkIfDatabaseExists(dbName);

    public dropDatabase(dbName: string) {
        return this.getCouchDb(dbName).then(db =>
            db
                .destroy()
                .then(() => true)
                .catch(() => false),
        );
    }

    public dropLocalDatabase(dbName: string) {
        return this.getLocalCouchDb(dbName).then(db =>
            db
                .destroy()
                .then(() => true)
                .catch(() => false),
        );
    }

    private getCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
        return this.getSettings()
            .then(settings => {
                const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
                return Promise.resolve(couch);
            })
            .catch(err => new PouchDB(this.dbNames.emptyDb));
    }

    private getLocalCouchDb(dbName: string): Promise<PouchDB.Database<{}>> {
        return Promise.resolve(new PouchDB(dbName));
    }

    public syncDb(dbName: string) {
        return this.dropDatabase(dbName)
            .then(() => {
                return this.getSettings().then(settings => {
                    const pouch = new PouchDB(`${dbName}`);
                    const couch = new PouchDB(`${settings.serverConnection.url}/${dbName}`);
                    return pouch
                        .sync(couch, { push: true as any, pull: false as any, batch_size: 1000 })
                        .then(() => true)
                        .catch(() => true);
                });
            })
            .catch(err => new PouchDB(this.dbNames.emptyDb));
    }

    private _checkIfDatabaseExists(dbName: string) {
        return this.getDatabase(dbName)
            .then(() => true)
            .catch(() => false);
    }

    public getSettings() {
        return this.getLocalDatabase(this.dbNames.setting).then(db =>
            db.allDocs(assign({}, { include_docs: true })).then(res => first(res.rows.map(y => y.doc)) as P.Setting),
        );
    }

    private setCouchLoginTime(timestamp: number) {
        return localStorage.setItem('couchdb_lastLoginTime', timestamp.toString());
    }

    public loginToDatabase(credentials: { username: string; password: string }): Promise<PouchDB.Database<{}>> {
        return this.getSettings().then(settings => {
            const couch = new PouchDB(`${settings.serverConnection.url}/${this.dbNames.users}`);

            return this.couchLogin(couch)(credentials.username, credentials.password).then(x => {
                this.setCouchLoginTime(+new Date());
                return couch;
            }) as any;
        });
    }

    private couchLogin = (couch: any) => (username, password) => {
        return new Promise((resolve, reject) => {
            couch.login(username, password, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });
    };

    public checkServerConnection() {
        return from(this.getSettings()).pipe(
            flatMap(settings =>
                ajax({
                    url: settings.serverConnection.url,
                    method: 'GET',
                    crossDomain: true,
                }),
            ),
        );
    }

    public listUserDatabases() {
        return from(this.getSettings()).pipe(
            flatMap(settings =>
                ajax({
                    url: `${settings.serverConnection.url}/_all_dbs`,
                    headers: { 'Content-Type': 'application/json' },
                    crossDomain: true,
                    withCredentials: true,
                    responseType: 'json',
                    method: 'GET',
                }).pipe(
                    map(x => x.response as string[]),
                    catchError(() => of([])),
                ),
            ),
            map((dbs: string[]) => dbs.filter(n => n.startsWith('user_'))),
        );
    }

    public getUserDatabaseName(preiserheberId: string) {
        return `user_${preiserheberId}`;
    }

    public loadAllPreismeldestellen() {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>(preismeldestelleId()).pipe(
            flatMap(preismeldestellen =>
                this.getDatabaseAsObservable(this.dbNames.preismeldestelle).pipe(
                    flatMap(db => this.getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId())),
                    map(unassignedPms => {
                        const remainingPms = unassignedPms.filter(
                            pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer),
                        );
                        return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer);
                    }),
                ),
            ),
        );
    }

    public loadAllPreismeldungen(pmsNummer: string = '') {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId(pmsNummer)).pipe(
            flatMap((preismeldungen: any[]) =>
                this.getDatabaseAsObservable(this.dbNames.preismeldung).pipe(
                    flatMap(db =>
                        this.getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
                            db,
                            preismeldungRefId(pmsNummer),
                        ).then(pmRefs => keyBy(pmRefs, pmRef => this.getPreismeldungId(pmRef))),
                    ),
                    map(pmRefs =>
                        preismeldungen.map(
                            pm =>
                                assign({}, pm, { pmRef: pmRefs[this.getPreismeldungId(pm)] }) as P.Preismeldung & {
                                    pmRef: P.PreismeldungReference;
                                },
                        ),
                    ),
                ),
            ),
        );
    }

    public loadAllPreiserheber() {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber').pipe(
            flatMap(preiserheber =>
                this.getDatabaseAsObservable(this.dbNames.preiserheber).pipe(
                    flatMap(db => this.getAllDocumentsFromDb<P.Erheber>(db)),
                    map(unassignedPe => {
                        const remainingPe = unassignedPe.filter(
                            pe => !preiserheber.some(x => x.username === pe.username),
                        );
                        return sortBy(
                            [...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe],
                            pe => pe.username,
                        );
                    }),
                ),
            ),
        );
    }

    public loadPreiserheber(id: string) {
        return this.listUserDatabases().pipe(
            flatMap(userDbNames => {
                const userDbName = userDbNames.find(dbName => dbName === this.getUserDatabaseName(id));
                if (userDbName) {
                    return this.getDatabaseAsObservable(userDbName).pipe(
                        flatMap(db =>
                            this.getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe =>
                                assign(pe, { _id: pe.username }),
                            ),
                        ),
                    );
                }
                return this.getDatabaseAsObservable(this.dbNames.preiserheber).pipe(
                    flatMap(db => this.getDocumentByKeyFromDb<P.Erheber>(db, id)),
                );
            }),
        );
    }

    public updatePreiserheber(preiserheber: P.Erheber) {
        return this.listUserDatabases().pipe(
            flatMap(userDbNames => {
                const userDbName = userDbNames.find(
                    dbName => dbName === this.getUserDatabaseName(preiserheber.username),
                );
                if (userDbName) {
                    return this.getDatabaseAsObservable(userDbName).pipe(
                        map(db => ({
                            db,
                            updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber' }),
                        })),
                    );
                }
                return this.getDatabaseAsObservable(this.dbNames.preiserheber).pipe(
                    map(db => ({
                        db,
                        updatedPreiserheber: preiserheber,
                    })),
                );
            }),
            flatMap(({ db, updatedPreiserheber }) => db.put(updatedPreiserheber)),
        );
    }

    public getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string): Observable<T[]> {
        return this.listUserDatabases().pipe(
            flatMap(dbnames =>
                from(dbnames).pipe(
                    flatMap(dbname => this.getDatabaseAsObservable(dbname)),
                    flatMap(db => this.getAllDocumentsForPrefixFromDb<T>(db, prefix)),
                    reduce((acc, docs) => [...acc, ...docs], []),
                ),
            ),
        );
    }

    public getAllDocumentsForPrefixFromUserDbsKeyed<T extends P.CouchProperties>(
        prefix: string,
    ): Observable<{ [username: string]: T[] }> {
        return this.listUserDatabases().pipe(
            flatMap(dbnames =>
                from(dbnames).pipe(
                    flatMap(dbname =>
                        this.getAllDocumentsForPrefixFromDbName<T>(dbname, prefix).pipe(
                            map(docs => ({
                                [dbname.substr(5)]: docs,
                            })),
                        ),
                    ),
                    reduce((acc, docs) => ({ ...acc, ...docs }), {}),
                ),
            ),
        );
    }

    private getPreismeldungId(doc: { pmsNummer: string; epNummer: string; laufnummer: string }) {
        return `${doc.pmsNummer}/${doc.epNummer}/${doc.laufnummer}`;
    }
}
