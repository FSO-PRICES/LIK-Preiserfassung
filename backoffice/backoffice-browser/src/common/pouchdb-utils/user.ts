import { Observable } from 'rxjs/Observable';

import { Models as P } from 'lik-shared';

import { getDatabaseAsObservable, getDatabase, getSettings, listAllDatabases, dbRoles } from './database';

export function createOrUpdateUser(erheber: P.Erheber, password: string) {
    return getDatabaseAsObservable('_users')
        .flatMap(db =>
            db
                .get(`org.couchdb.user:${erheber.username}`)
                .then(() => true)
                .catch(() => false)
                .then(userExists => ({ db, userExists }))
        )
        .flatMap(x => (x.userExists ? updateUser(erheber, password) : createUser(erheber, password)));
}

function createUser(erheber: P.Erheber, password: string) {
    return getDatabase('_users').then((db: any) =>
        db.signUp(erheber._id, password, {
            roles: [dbRoles.erheber],
        })
    );
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
    return getDatabase('_users')
        .then((db: any) => db.get(`org.couchdb.user:${username}`).then(doc => db.remove(doc)))
        .then(() => true)
        .catch(() => false);
}

export function putAdminUserToDatabase(dbName, username: string) {
    return putUserToDatabase(dbName, { members: { names: [username] } });
}

export async function putAdminUserToDatabaseAsync(dbName, username: string) {
    return putUserToDatabaseAsync(dbName, { members: { names: [username] } });
}

export async function putRoleToDatabaseAsync(dbName, role: string) {
    return putUserToDatabaseAsync(dbName, { members: { roles: [role] } });
}

export function putUserToDatabase(dbName, users: P.CouchSecurity) {
    return Observable.fromPromise(
        getSettings().then(settings =>
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

export async function putUserToDatabaseAsync(dbName, users: P.CouchSecurity) {
    return await createRequestAsync(`${dbName}/_security`, 'PUT', users);
}

export async function getAuthorizedUsersAsync(dbName) {
    return await createRequestAsync(`${dbName}/_security`, 'GET');
}

export function getUserDatabaseName(preiserheberId: string) {
    return `user_${preiserheberId}`;
}

export function listUserDatabases() {
    return listAllDatabases().map((dbs: string[]) => dbs.filter(n => n.startsWith('user_')));
}

async function createRequestAsync(path: string, method: 'GET' | 'POST' | 'PUT', body?: any) {
    return getSettings().then(settings => {
        return new Promise<P.CouchSecurity>((resolve, reject) => {
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
