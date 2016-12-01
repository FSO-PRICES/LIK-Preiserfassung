import * as PouchDB from 'pouchdb';

const couch = new PouchDB('http://localhost:5984/test-couch');
const pouch = new PouchDB('test-couch');

// (PouchDB as any).debug.enable('pouchdb:api');
(PouchDB as any).debug.enable('pouchdb:http');

function sync() {
    pouch.sync(couch);
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

query();
// sync();
// modifyLocal();
// deleteDatabase();
