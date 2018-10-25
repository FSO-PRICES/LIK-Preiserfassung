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
