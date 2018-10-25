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

import { setSettings, navigateTo, login } from '../support/helpers';

context('Window', () => {
    beforeEach(() => {
        setSettings(cy);
        navigateTo(cy, 'Import');
    });

    it('should login correctly', () => {
        login(cy);
        cy.get('pef-dialog-login').should('not.exist');
    });

    it('fail on wrong credentials', () => {
        login(cy, 'not-existing');
        cy.get('pef-dialog-login').should('exist');
        cy.get('pef-dialog-login .error').should('exist');
    });
});
