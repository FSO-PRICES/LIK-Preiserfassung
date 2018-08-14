// import { DB_NAME } from '../../src/effects/pouchdb-utils';
import PouchDB from 'pouchdb';
import PouchDBLoad from 'pouchdb-load';
PouchDB.plugin(PouchDBLoad);

context('Window', () => {
    beforeEach(() => {
        cy.visit('#/settings');
    });

    // it('get the title', () => {
    //     cy.title().should('include', 'Preiserfassung LIK');
    // });

    it('write url', async () => {
        localStorage.removeItem('bfs-pe-server-url');
        cy.readFile('cypress/fixtures/pouch_databases.dump').then(data => {
            return new Cypress.Promise((resolve, reject) => {
                const db = new PouchDB('lik') as any;
                cy.log('data', data);
                return db
                    .load(data)
                    .then(function() {
                        cy.log('ok');
                        resolve();
                        // done loading!
                    })
                    .catch(function(err) {
                        cy.log('not ok', err);
                        reject(err);
                        // HTTP error or something like that
                    });
            });
        });

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
