import { assign } from 'lodash';
import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import PouchDBLoad from 'pouchdb-load';
PouchDBAllDbs(PouchDB);
PouchDB.plugin(PouchDBLoad);

context('Window', () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        clearDb('settings');
        cy.visit('#/settings');
    });

    it('get the title', () => {
        cy.title().should('include', 'LIK PreisAdmin');
    });

    it('write url', () => {
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

async function clearDb(db: string) {
    return new PouchDB(db).destroy();
}
