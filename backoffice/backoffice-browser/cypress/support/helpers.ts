import PouchDB from 'pouchdb';
import * as PouchDBAllDbs from 'pouchdb-all-dbs';
import PouchDBLoad from 'pouchdb-load';
PouchDBAllDbs(PouchDB);
PouchDB.plugin(PouchDBLoad);

export function setSettings(cy: Cypress.Chainable<any>) {
    cy.clearLocalStorage();
    cy.wrap(null).then(
        () =>
            new Cypress.Promise((resolve, reject) => {
                clearDb('settings')
                    .catch(error => {
                        cy.log('error', error);
                        reject(error);
                    })
                    .then(() => {
                        cy.log('settings cleared');
                        resolve();
                    });
            })
    );
    cy.log('visitting settings');
    cy.visit('#/settings');
    cy.log('settings visited');

    const value = 'http://localhost:5984';
    cy.get('[formcontrolname="url"] input')
        .clear()
        .type(value);
    cy.get('button#save').click();
    cy.get('ion-loading').should('be.visible');
    cy.get('ion-loading').should('not.be.visible');
}

export function clearDb(db: string) {
    return new PouchDB(db).destroy();
}

export const pages = {
    Status: 'Status',
    Import: 'Import',
    PMS: 'PMS',
    Preiserheber: 'Preiserheber',
    Preise: 'Preise',
    Controlling: 'Controlling',
    Reporting: 'Reporting',
    Export: 'Export',
};

export function navigateTo(cy: Cypress.Chainable<any>, page: keyof typeof pages) {
    cy.get(`header #page_${page}`).click();
}

export function login(cy: Cypress.Chainable<any>, username?: string) {
    cy.get('[formcontrolname="username"] input')
        .clear()
        .type(username || 'test-admin');

    const password = '1234qwer';
    cy.get('[formcontrolname="password"] input')
        .clear()
        .type(password);

    cy.get('button[type=submit]').click();
}
