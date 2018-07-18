import PouchDB from './pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(pouchDbAuthentication);
// PouchDB.debug.enable('pouchdb:api');
PouchDB.debug.enable('pouchdb:http');

export * from './database';
export * from './documents';
export * from './misc';
export * from './user';
