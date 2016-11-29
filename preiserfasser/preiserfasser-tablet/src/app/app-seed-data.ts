import * as pouchdb from 'pouchdb';

const DB_NAME = 'preiserfasser';

// declare var require: any;
// const products = JSON.stringify(require('./products.json'));

export function seedData() {
    // console.log(products.length);
    // resetDatabase()
    //     .then(db => {
    //         return db;
    //     })
    //     .then(() => console.log(`completed reset of database '${DB_NAME}'`));
}

function resetDatabase() { // tslint:disable-line
    return deleteDatabase()
        .then(() => createDatabase());
}

function deleteDatabase() {
    return createDatabase().then(db => createDatabase());
}

function createDatabase() {
    return Promise.resolve(new pouchdb(DB_NAME));
}
