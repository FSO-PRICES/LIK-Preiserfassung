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

import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { flatMap, map, reduce } from 'rxjs/operators';

import { Models as P } from '@lik-shared';

import { getDatabase, getDatabaseAsObservable, getSettings, listAllDatabases } from './database';
import { getAllDocumentsForPrefixFromDbName } from './documents';

export function createOrUpdateUser(erheber: P.Erheber, password: string) {
    return getDatabaseAsObservable('_users').pipe(
        flatMap(db =>
            db
                .get(`org.couchdb.user:${erheber.username}`)
                .then(() => true)
                .catch(() => false)
                .then(userExists => ({ db, userExists })),
        ),
        flatMap(x => (x.userExists ? updateUser(erheber, password) : createUser(erheber, password))),
    );
}

function createUser(erheber: P.Erheber, password: string) {
    return getDatabase('_users').then((db: any) => db.signUp(erheber._id, password));
}

export async function updateUser(erheber: P.Erheber, password: string) {
    const db = await getDatabase('_users');
    if (!!password) {
        return db.changePassword(erheber._id, password);
    }
    return Promise.resolve(true);
}

export function deleteUser(username: string) {
    return getDatabase('_users')
        .then((db: any) => db.get(`org.couchdb.user:${username}`).then(doc => db.remove(doc)))
        .then(() => true)
        .catch(() => false);
}

export function putAdminUserToDatabase(dbName: string, username: string) {
    return putUserToDatabase(dbName, { members: { names: [username] } });
}

export async function putAdminUserToDatabaseAsync(dbName: string, username: string) {
    return putUserToDatabaseAsync(dbName, { members: { names: [username] } });
}

export async function makeDbReadonly(dbName: string) {
    const doc = {
        _id: '_design/auth',
        language: 'javascript',
        validate_doc_update:
            "function(newDoc, oldDoc, userCtx) {\r\n  if (userCtx.roles.indexOf('_admin') !== -1) {\r\n    return;\r\n  } else {\r\n    throw({forbidden: 'Readonly'});\r\n  }\r\n}",
    };
    await getDatabase(dbName).then(db =>
        db
            .get(doc._id)
            .then(() => true)
            .catch(() => false)
            .then(exists => (!!exists ? null : db.put(doc))),
    );
}

export function putUserToDatabase(dbName, users: P.CouchSecurity) {
    return from(
        getSettings().then(settings =>
            ajax({
                url: `${settings.serverConnection.url}/${dbName}/_security`,
                body: users,
                headers: { 'Content-Type': 'application/json' },
                crossDomain: true,
                withCredentials: true,
                responseType: 'json',
                method: 'PUT',
                timeout: 50000,
            }),
        ),
    ).pipe(flatMap(x => x));
}

export async function putUserToDatabaseAsync(dbName, users: P.CouchSecurity) {
    return await createRequestAsync(`${dbName}/_security`, 'PUT', users);
}

export async function getAuthorizedUsersAsync(dbName) {
    return await createRequestAsync(`${dbName}/_security`, 'GET');
}

export async function logout() {
    return await createRequestAsync('_session', 'DELETE').catch(() => false);
}

export function getUserDatabaseName(preiserheberId: string) {
    return `user_${preiserheberId}`;
}

export function listUserDatabases() {
    return listAllDatabases().pipe(map((dbs: string[]) => dbs.filter(n => n.startsWith('user_'))));
}

async function createRequestAsync(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) {
    return getSettings().then(settings => {
        return new Promise<P.CouchSecurity>((resolve, reject) => {
            if (!settings || !settings.serverConnection || !settings.serverConnection.url) {
                resolve(null);
                return;
            }
            const xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open(method, `${settings.serverConnection.url}/${path}`, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                    });
                }
            };
            xhr.onerror = () => {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            };
            if (!!body) {
                xhr.send(JSON.stringify(body));
            } else {
                xhr.send();
            }
        });
    });
}

export function getAllDocumentsForPrefixFromUserDbsKeyed<T extends P.CouchProperties>(
    prefix: string,
): Observable<{ [username: string]: T[] }> {
    return listUserDatabases().pipe(
        flatMap(dbnames =>
            from(dbnames).pipe(
                flatMap(dbname =>
                    getAllDocumentsForPrefixFromDbName<T>(dbname, prefix).pipe(
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
