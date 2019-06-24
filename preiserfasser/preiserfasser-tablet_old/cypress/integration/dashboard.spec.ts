// import { DB_NAME } from '../../src/effects/pouchdb-utils';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import PouchDBLoad from 'pouchdb-load';
PouchDBAllDbs(PouchDB);
PouchDB.plugin(PouchDBLoad);

context('Window', () => {
    beforeEach(() => {
        localStorage.setItem('bfs-pe-server-url', 'http://172.30.30.10:5984');
        cy.server();
        cy.route({
            method: 'GET',
            url: 'http://172.30.30.10:5984/',
            status: 500,
            response: {}, //{ version: '2.1.1' },
        });
        ((new PouchDB('lik') as any) || {}).destroy();
        cy.readFile('cypress/fixtures/pouch_databases.dump').then(data => {
            const db = new PouchDB('lik') as any;
            return db
                .load(data)
                .then(() => {
                    return new PouchDB('lik').put({ _id: '_local/initial_load_complete' });
                })
                .catch(err => {});
        });
        cy.visit('#/dashboard', {
            onBeforeLoad: w => {
                w.console.log('APP INITIATING ###########');
            },
            onLoad: w => {
                w.console.log('APP LOADED HOOK $$$$$$$$$$$$$$$$$$$$$$$');
            },
        });
    });

    // it('get the title', () => {
    //     cy.title().should('include', 'Preiserfassung LIK');
    // });

    it('write url', () => {
        // cy.get('.settings-buttons-container button').click();
        // cy.get('settings-page a.button').click();
        // const value = 'http://172.30.30.10:5984';
        // cy.get('[formcontrolname="url"] input')
        //     .clear()
        //     .type(value);
        // cy.get('button#save').click();
        // cy.get('ion-loading').should('be.visible');
        // cy.get('ion-loading').should('not.be.visible');
        // cy.reload();
        // cy.get('[formcontrolname="url"] input').should('have.value', value);
    });
});
