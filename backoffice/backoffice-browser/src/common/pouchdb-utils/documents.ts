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
