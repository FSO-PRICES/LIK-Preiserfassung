import { importFromJsonString } from 'indexeddb-export-import';
import * as bluebird from 'bluebird';
import { database_seed } from '../fixtures/pouch_databases';

context('Window', () => {
    beforeEach(() => {
        cy.visit('#/settings');
    });

    it('get the title', () => {
        cy.title().should('include', 'LIK PreisAdmin');
    });

    it('write url', async () => {
        const dbs = [
            '_pouch_lik',
            '_pouch_pouch__all_dbs__',
            '_pouch_preismeldungen',
            '_pouch_preismeldungen_status',
            '_pouch_settings',
        ];
        let exportedDbs = {};

        const imports = bluebird.mapSeries(dbs, (db: string) => {
            return new bluebird.Promise((resolve, reject) => {
                console.log('Opening: ', db);
                const dbConnection = window.indexedDB.open(db, 5);
                dbConnection.onsuccess = function(event) {
                    const idb_db = dbConnection.result;
                    importFromJsonString(idb_db, database_seed[db], function(err) {
                        if (!err) {
                            console.log('Imported data successfully');
                            resolve({ [db]: 'loaded' });
                        } else {
                            console.error(err);
                            reject(err);
                        }
                    });
                };
            });
        });
        console.log('Imported result:', JSON.stringify((await imports).reduce((acc, x) => ({ ...acc, ...x }), {})));

        const value = 'http://172.30.30.10:5984';
        cy.get('[formcontrolname="url"] input')
            .clear()
            .type(value);
        cy.get('button#save').click();
        cy.get('ion-loading').should('be.visible');
        cy.get('ion-loading').should('not.be.visible');
        cy.reload();
        cy.get('[formcontrolname="url"] input').should('have.value', value);
    });
});
