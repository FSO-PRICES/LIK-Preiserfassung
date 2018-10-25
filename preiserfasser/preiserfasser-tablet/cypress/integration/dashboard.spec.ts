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
