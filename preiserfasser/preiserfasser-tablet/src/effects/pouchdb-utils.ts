import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

const DB_NAME = 'lik';

function _checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any).allDbs()
        .then((dbs: string[]) => (dbs || []).some(x => x === dbName));
}

export function getDatabase(): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return _checkIfDatabaseExists(DB_NAME)
        .then(exists => {
            if (!exists) throw new Error(`Database 'lik' does not exist`);
            return new PouchDB(DB_NAME);
        })
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}/`,
        endkey: `${prefix}/\uffff`
    };
}

export const checkIfDatabaseExists = () => _checkIfDatabaseExists(DB_NAME);

export function dropDatabase() {
    return _checkIfDatabaseExists(DB_NAME)
        .then(exists => {
            if (exists) {
                const db = new PouchDB(DB_NAME);
                return db.destroy().then(() => { });
            }
            return Promise.resolve({});
        });
}

export function dropAndSyncDatabase() {
    return _checkIfDatabaseExists(DB_NAME)
        .then(exists => {
            if (exists) {
                const db = new PouchDB(DB_NAME);
                return db.destroy().then(() => new PouchDB(DB_NAME));
            }
            return Promise.resolve(new PouchDB(DB_NAME));
        })
        .then(pouch => {
            // const couch = new PouchDB('http://bfs-lik.lambda-it.ch:5984/germaine_exemple') as any;
            const couch = new PouchDB('http://localhost.ch:5984/germaine_exemple') as any;
            const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

            return login('germaine_exemple', 'secret')
                .then(() => {
                    const sync = bluebird.promisify<any, any, any>(pouch.sync, { context: pouch });
                    return sync(couch, { push: false, pull: true, batch_size: 1000 });
                });
        });
}

export function initialisePouchForDev() {
    (window as any).PouchDB = PouchDB;
    (PouchDB as any).debug.enable('pouchdb:http');
}
