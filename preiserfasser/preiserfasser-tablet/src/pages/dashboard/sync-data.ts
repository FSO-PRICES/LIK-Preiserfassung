// import * as bluebird from 'bluebird';
// import * as PouchDB from 'pouchdb';
// import * as PouchDBAllDbs from 'pouchdb-all-dbs';
// import * as pouchDbAuthentication from 'pouchdb-authentication';

// PouchDBAllDbs(PouchDB);
// PouchDB.plugin(pouchDbAuthentication);

// // import * as docuri from 'docuri';
// // const productUri = docuri.route('product/:productKey');
// // const pmsUri = docuri.route('preismeldestelle/:pmsKey');

// export function syncData() {
//     const couch = new PouchDB('http://192.168.1.136:5986/germaine_exemple') as any;
//     const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

//     return resetDatabase('lik')
//         .then(pouch => login('germaine_exemple', 'secret').then(() => pouch))
//         .then(pouch => {
//             const sync = bluebird.promisify<any, any, any>(pouch.sync, { context: pouch });
//             return sync(couch, { push: false, pull: true });
//         });
// }

// export function initialisePouchForDev() {
//     (window as any).PouchDB = PouchDB;
//     (PouchDB as any).debug.enable('pouchdb:http');
// }

// function resetDatabase(dbName: string) { // tslint:disable-line
//     return deleteDatabase(dbName)
//         .then(() => createOrGetDatabase(dbName));
// }

// function deleteDatabase(dbName: string) {
//     return createOrGetDatabase(dbName).then(db => db.destroy())
//         .then(() => console.log('database destroyed'));
// }

// function createOrGetDatabase(dbName: string) {
//     return Promise.resolve(new PouchDB(dbName));
// }

// function checkIfDatabaseExists(dbName): Promise<boolean> {
//     return (PouchDB as any)
//         .allDbs((dbs: string[]) => (dbs || []).some(x => x === dbName));
// }

// function _getProductCount(dbName: string) {
//     return new PouchDB(dbName)
//         .allDocs({
//             startkey: 'product/',
//             endkey: 'product/\uffff'
//         })
//         .then(results => results.rows.length);
// }

// export function getProductCount() {
//     return checkIfDatabaseExists('lik')
//         .then(exists => !exists ? Promise.resolve(0) : _getProductCount('lik'));
// }

// // alert(productUri({ productKey: '\uffff' }) === 'product/\uffff');
