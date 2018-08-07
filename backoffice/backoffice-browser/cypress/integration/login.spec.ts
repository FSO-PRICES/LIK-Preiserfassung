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
