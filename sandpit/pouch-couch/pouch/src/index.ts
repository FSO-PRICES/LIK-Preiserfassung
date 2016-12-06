import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDB.plugin(pouchDbAuthentication);

const couch = new PouchDB('http://localhost:5986/germaine_exemple') as any;
const pouch = new PouchDB('lik');

var xxx = new PouchDB('');

// (PouchDB as any).debug.enable('pouchdb:api');
(PouchDB as any).debug.enable('pouchdb:http');

function sync() {
    pouch.sync(couch, { push: false, pull: true });
    // (PouchDB as any).debug.disable();
}

function modifyLocal() {
    // console.log('blah')
    pouch.get('preismeldestelle_Manor')
        .then(x => {
            console.log('modifyLocal', x)
            x['priceReports'][1].price = 1.74;
            return pouch.put(x);
        })
        .catch(reason => {
            console.log('failed:', reason);
        });
}

function deleteDatabase() {
    pouch.destroy()
        .then(() => console.log('database destroyed'));
}

function query() {
    couch.allDocs({
        include_docs: true,
        startkey: 'pm/',
        endkey: 'pm/\uffff'
    })
    .then(x => console.log(x));
}

const login = bluebird.promisify<string, string, any>(couch.login, { context: couch });

// couch.login('germaine_exemple', 'secret', x => {
//     alert('xxx')
//     console.log(JSON.stringify(x));
// });

login('germaine_exemple', 'secret')
    .then(x => {
        // query();
        sync();
        // modifyLocal();
        // deleteDatabase();
    })
