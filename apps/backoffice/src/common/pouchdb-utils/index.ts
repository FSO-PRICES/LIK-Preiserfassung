import PouchDB from 'pouchdb';
import PouchDBAllDbs from 'pouchdb-all-dbs';
import pouchDbAuthentication from 'pouchdb-authentication';
import PouchDBFind from 'pouchdb-find';

PouchDBAllDbs(PouchDB);
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(pouchDbAuthentication);
// PouchDB.debug.enable('pouchdb:api');
PouchDB.debug.enable('pouchdb:http');

export * from './database';
export * from './documents';
export * from './misc';
export * from './user';
