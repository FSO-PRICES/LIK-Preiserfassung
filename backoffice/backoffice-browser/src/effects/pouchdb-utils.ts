import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

const couchDbUrl = 'http://localhost:5984/'
const username = 'lik-admin';
const password = 'FwtjYWZW4T2PNWOt4cx3';

PouchDB.plugin(pouchDbAuthentication);

export function getDatabase(dbName): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return getCouchDb(dbName)
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`
    };
}

export const checkIfDatabaseExists = (dbName) => _checkIfDatabaseExists(dbName);

export function dropDatabase(dbName) {
    return _checkIfDatabaseExists(dbName)
        .then(exists => {
            if (exists) {
                const db = new PouchDB(dbName);
                return db.destroy().then(() => { });
            }
            return Promise.resolve({});
        });
}

function getCouchDb(dbName: string): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    const couch = new PouchDB(`${couchDbUrl}${dbName}`);
    const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

    return login(username, password).then(x => couch) as any
}

function _checkIfDatabaseExists(dbName) {
    return new Promise((resolve, _) => resolve(true));
}
