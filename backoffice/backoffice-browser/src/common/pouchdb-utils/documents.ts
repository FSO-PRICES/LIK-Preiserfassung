import { Observable } from 'rxjs/Observable';
import { assign } from 'lodash';

import { Models as P } from 'lik-shared';

import { getDatabaseAsObservable } from './database';

export function getAllDocumentsForPrefix(prefix: string): PouchDB.Core.AllDocsWithinRangeOptions {
    return {
        startkey: `${prefix}`,
        endkey: `${prefix}\uffff`,
    };
}

export function getAllDocumentsFromDb<T extends P.CouchProperties>(db: PouchDB.Database<{}>): Promise<T[]> {
    return db.allDocs({ include_docs: true }).then(x => x.rows.map(row => row.doc as T));
}

export function getAllDocumentsFromDbName<T extends P.CouchProperties>(dbName: string): Observable<T[]> {
    return getDatabaseAsObservable(dbName).flatMap(db => getAllDocumentsFromDb<T>(db));
}

export function getAllDocumentsForPrefixFromDb<T extends P.CouchProperties>(
    db: PouchDB.Database<{}>,
    prefix: string
): Promise<T[]> {
    return db
        .allDocs(assign({}, { include_docs: true }, getAllDocumentsForPrefix(prefix)))
        .then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
}

export function getAllIdRevsForPrefixFromDb(db: PouchDB.Database<{}>, prefix: string): Promise<P.CouchProperties[]> {
    return db
        .allDocs(getAllDocumentsForPrefix(prefix))
        .then(x => x.rows.map(row => ({ _id: row.id, _rev: row.value.rev })));
}

export function getAllDocumentsForPrefixFromDbName<T extends P.CouchProperties>(
    dbName: string,
    prefix: string
): Observable<T[]> {
    return getDatabaseAsObservable(dbName).flatMap(db => getAllDocumentsForPrefixFromDb<T>(db, prefix));
}

export function getAllDocumentsForKeysFromDb<T extends P.CouchProperties>(
    db: PouchDB.Database<{}>,
    keys: string[]
): Promise<T[]> {
    return db.allDocs({ include_docs: true, keys }).then(x => x.rows.map(row => row.doc)) as Promise<T[]>;
}

export function getDocumentByKeyFromDb<T>(db: PouchDB.Database<{}>, key: string): Promise<T> {
    return db.get(key).then((doc: any) => doc as T);
}

export function clearRev<T>(o: any): T {
    return assign({}, o, { _rev: undefined }) as T;
}
