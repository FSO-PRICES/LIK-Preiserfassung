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

import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable } from 'rxjs';
import { first, assign, sortBy, keyBy } from 'lodash';

import { Models as P, preismeldungId, preismeldungRefId, preismeldestelleId } from 'lik-shared';

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
        PouchDBAllDbs(PouchDB);
        PouchDB.plugin(pouchDbAuthentication);
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
        return Observable.fromPromise(
            this.getSettings().then(settings =>
                Observable.ajax({
                    url: `${settings.serverConnection.url}/${dbName}/_security`,
                    body: users,
                    headers: { 'Content-Type': 'application/json' },
                    crossDomain: true,
                    withCredentials: true,
                    responseType: 'json',
                    method: 'PUT',
                })
            )
        ).flatMap(x => x);
    }

    public getDatabase(dbName): Promise<PouchDB.Database<{}>> {
        return this.getCouchDb(dbName);
    }

    public getDatabaseAsObservable = (dbName: string) => Observable.fromPromise(this.getDatabase(dbName));

    public getLocalDatabase(dbName) {
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
        prefix: string
    ): Promise<T[]> {
        return db
            .allDocs(assign({}, { include_docs: true }, this.getAllDocumentsForPrefix(prefix)))
            .then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
    }

    public getAllDocumentsForPrefixFromDbName<T extends P.CouchProperties>(
        dbName: string,
        prefix: string
    ): Observable<T[]> {
        return this.getDatabaseAsObservable(dbName).flatMap(db => this.getAllDocumentsForPrefixFromDb<T>(db, prefix));
    }

    public getAllDocumentsForKeysFromDb<T extends P.CouchProperties>(
        db: PouchDB.Database<{}>,
        keys: string[]
    ): Promise<T[]> {
        return db.allDocs({ include_docs: true, keys }).then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
    }

    public getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
        return db.get(key).then((doc: any) => doc as T);
    }

    public clearRev<T>(o: any): T {
        return assign({}, o, { _rev: undefined }) as T;
    }

    public checkIfDatabaseExists = dbName => this._checkIfDatabaseExists(dbName);

    public dropDatabase(dbName) {
        return this.getCouchDb(dbName).then(db =>
            db
                .destroy()
                .then(() => true)
                .catch(() => false)
        );
    }

    public dropLocalDatabase(dbName) {
        return this.getLocalCouchDb(dbName).then(db =>
            db
                .destroy()
                .then(() => true)
                .catch(() => false)
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
                        .sync(couch, { push: true, pull: false, batch_size: 1000 })
                        .then(() => true)
                        .catch(() => true);
                });
            })
            .catch(err => new PouchDB(this.dbNames.emptyDb));
    }

    private _checkIfDatabaseExists(dbName) {
        return this.getDatabase(dbName)
            .then(() => true)
            .catch(() => false);
    }

    public getSettings() {
        return this.getLocalDatabase(this.dbNames.setting).then(db =>
            db.allDocs(assign({}, { include_docs: true })).then(res => first(res.rows.map(y => y.doc)) as P.Setting)
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
        return Observable.fromPromise(this.getSettings()).flatMap(settings =>
            Observable.ajax({
                url: settings.serverConnection.url,
                method: 'GET',
                crossDomain: true,
            })
        );
    }

    public listUserDatabases() {
        return Observable.fromPromise(this.getSettings())
            .flatMap(settings =>
                Observable.ajax({
                    url: `${settings.serverConnection.url}/_all_dbs`,
                    headers: { 'Content-Type': 'application/json' },
                    crossDomain: true,
                    withCredentials: true,
                    responseType: 'json',
                    method: 'GET',
                })
                    .map(x => x.response as string[])
                    .catch(error => Observable.of([]))
            )
            .map((dbs: string[]) => dbs.filter(n => n.startsWith('user_')));
    }

    public getUserDatabaseName(preiserheberId: string) {
        return `user_${preiserheberId}`;
    }

    public loadAllPreismeldestellen() {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Preismeldestelle>(preismeldestelleId()).flatMap(
            preismeldestellen =>
                this.getDatabaseAsObservable(this.dbNames.preismeldestelle)
                    .flatMap(db => this.getAllDocumentsForPrefixFromDb<P.Preismeldestelle>(db, preismeldestelleId()))
                    .map(unassignedPms => {
                        const remainingPms = unassignedPms.filter(
                            pms => !preismeldestellen.some(x => x.pmsNummer === pms.pmsNummer)
                        );
                        return sortBy([...preismeldestellen, ...remainingPms], pms => pms.pmsNummer);
                    })
        );
    }

    public loadAllPreismeldungen(pmsNummer: string = '') {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Preismeldung>(preismeldungId(pmsNummer)).flatMap(
            (preismeldungen: any[]) =>
                this.getDatabaseAsObservable(this.dbNames.preismeldung)
                    .flatMap(db =>
                        this.getAllDocumentsForPrefixFromDb<P.PreismeldungReference>(
                            db,
                            preismeldungRefId(pmsNummer)
                        ).then(pmRefs => keyBy(pmRefs, pmRef => this.getPreismeldungId(pmRef)))
                    )
                    .map(pmRefs =>
                        preismeldungen.map(
                            pm =>
                                assign({}, pm, { pmRef: pmRefs[this.getPreismeldungId(pm)] }) as P.Preismeldung & {
                                    pmRef: P.PreismeldungReference;
                                }
                        )
                    )
        );
    }

    public loadAllPreiserheber() {
        return this.getAllDocumentsForPrefixFromUserDbs<P.Erheber>('preiserheber').flatMap(preiserheber =>
            this.getDatabaseAsObservable(this.dbNames.preiserheber)
                .flatMap(db => this.getAllDocumentsFromDb<P.Erheber>(db))
                .map(unassignedPe => {
                    const remainingPe = unassignedPe.filter(pe => !preiserheber.some(x => x.username === pe.username));
                    return sortBy(
                        [...preiserheber.map(pe => assign({}, pe, { _id: pe.username })), ...remainingPe],
                        pe => pe.username
                    );
                })
        );
    }

    public loadPreiserheber(id: string) {
        return this.listUserDatabases().flatMap(userDbNames => {
            const userDbName = userDbNames.find(dbName => dbName === this.getUserDatabaseName(id));
            if (userDbName) {
                return this.getDatabaseAsObservable(userDbName).flatMap(db =>
                    this.getDocumentByKeyFromDb<P.Erheber>(db, 'preiserheber').then(pe =>
                        assign(pe, { _id: pe.username })
                    )
                );
            }
            return this.getDatabaseAsObservable(this.dbNames.preiserheber).flatMap(db =>
                this.getDocumentByKeyFromDb<P.Erheber>(db, id)
            );
        });
    }

    public updatePreiserheber(preiserheber: P.Erheber) {
        return this.listUserDatabases()
            .flatMap(userDbNames => {
                const userDbName = userDbNames.find(
                    dbName => dbName === this.getUserDatabaseName(preiserheber.username)
                );
                if (userDbName) {
                    return this.getDatabaseAsObservable(userDbName).map(db => ({
                        db,
                        updatedPreiserheber: assign({}, preiserheber, { _id: 'preiserheber' }),
                    }));
                }
                return this.getDatabaseAsObservable(this.dbNames.preiserheber).map(db => ({
                    db,
                    updatedPreiserheber: preiserheber,
                }));
            })
            .flatMap(({ db, updatedPreiserheber }) => db.put(updatedPreiserheber));
    }

    public getAllDocumentsForPrefixFromUserDbs<T extends P.CouchProperties>(prefix: string): Observable<T[]> {
        return this.listUserDatabases().flatMap(dbnames =>
            Observable.from(dbnames)
                .flatMap(dbname => this.getDatabaseAsObservable(dbname))
                .flatMap(db => this.getAllDocumentsForPrefixFromDb<T>(db, prefix))
                .reduce((acc, docs) => [...acc, ...docs], [])
        );
    }

    public getAllDocumentsForPrefixFromUserDbsKeyed<T extends P.CouchProperties>(
        prefix: string
    ): Observable<{ [username: string]: T[] }> {
        return this.listUserDatabases().flatMap(dbnames =>
            Observable.from(dbnames)
                .flatMap(dbname =>
                    this.getAllDocumentsForPrefixFromDbName<T>(dbname, prefix).map(docs => ({
                        [dbname.substr(5)]: docs,
                    }))
                )
                .reduce((acc, docs) => ({ ...acc, ...docs }), {})
        );
    }

    private getPreismeldungId(doc: { pmsNummer: string; epNummer: string; laufnummer: string }) {
        return `${doc.pmsNummer}/${doc.epNummer}/${doc.laufnummer}`;
    }
}
