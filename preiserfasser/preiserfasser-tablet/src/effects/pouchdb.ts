import * as PouchDB from 'pouchdb';
// import  from 'pouchdb-core';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);

function checkIfDatabaseExists(dbName): Promise<boolean> {
    return (PouchDB as any)
        .allDbs((dbs: string[]) => (dbs || []).some(x => x === dbName));
}

export function getDatabase(): Promise<PouchDB.Database<PouchDB.Core.Encodable>> {
    return checkIfDatabaseExists('lik')
        .then(exists => {
            if (!exists) throw new Error(`Database 'lik' does not exists`);
            return new PouchDB('lik');
        })
}

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}/`,
        endkey: `${prefix}/\uffff`
    };
}
