import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

const couchDbUrl = 'http://localhost:5984/';
const USERNAME = 'lik-admin';
const PASSWORD = 'FwtjYWZW4T2PNWOt4cx3';

PouchDB.plugin(pouchDbAuthentication);


export function createUser(username: string, password: string) {
    return getDatabase('_users').then((db: any) => db.signUp(username, password));
}

export function getDatabase(dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getCouchDb(dbName, credentials);
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`
    };
}

export const checkIfDatabaseExists = (dbName) => _checkIfDatabaseExists(dbName);

export function dropDatabase(dbName, credentials: { username: string, password: string } = { username: USERNAME, password: PASSWORD }) {
    return _checkIfDatabaseExists(dbName)
        .then(exists => {
            if (exists) {
                return getCouchDb(dbName, credentials).then(db => db.destroy().then(() => true).catch(() => false));
            }
            return Promise.resolve(false);
        });
}

function getCouchDb(dbName: string, credentials: { username: string, password: string }): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    const couch = new PouchDB(`${couchDbUrl}${dbName}`);
    const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;
    console.log('logging in with:', credentials);

    return login(credentials.username, credentials.password).then(x => couch) as any;
}

function _checkIfDatabaseExists(dbName) {
    return Promise.resolve(true);
}
