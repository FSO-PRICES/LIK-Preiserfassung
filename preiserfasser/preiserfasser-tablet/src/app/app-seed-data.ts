import * as pouchdb from 'pouchdb';

const DB_NAME = 'preiserfasser';

// declare var require: any;
// const products = JSON.stringify(require('./products.json'));

export function seedData() {
    // console.log(products.length);
    return resetDatabase()
        .then(db => {
            db.put({
                _id: 'store_foobar',
                store: 'foobar',
                products: [
                    { name: 'bread', price: 1.0 },
                    { name: 'milk', price: 1.2 }
                ]
            });
            return db;
        })
        .then(() => console.log(`completed reset of database '${DB_NAME}'`));
    // return deleteDatabase();
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
    return Promise.resolve(new pouchdb(DB_NAME));
}
