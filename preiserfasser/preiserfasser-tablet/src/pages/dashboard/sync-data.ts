import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
(window as any).PouchDB = PouchDB;
// window.pou

import * as pouchDbAuthentication from 'pouchdb-authentication';
PouchDB.plugin(pouchDbAuthentication);

(PouchDB as any).debug.enable('pouchdb:http');

const DB_NAME = 'lik';
export function syncData() {
    const couch = new PouchDB('http://localhost:5986/germaine_exemple') as any;
    const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

    return resetDatabase()
        .then(pouch => login('germaine_exemple', 'secret').then(() => pouch))
        .then(pouch => {
            const sync = bluebird.promisify<any, any, any>(pouch.sync, { context: pouch });
            return sync(couch, { push: false, pull: true });
        });
}

function resetDatabase() { // tslint:disable-line
    return deleteDatabase()
        .then(() => createDatabase());
}

function deleteDatabase() {
    return createDatabase().then(db => db.destroy())
        .then(() => console.log('database destroyed'));
}

function createDatabase() {
    return Promise.resolve(new PouchDB(DB_NAME));
}

