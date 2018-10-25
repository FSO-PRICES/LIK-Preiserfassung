/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
