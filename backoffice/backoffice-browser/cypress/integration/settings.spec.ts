import { assign } from 'lodash';

context('Window', () => {
    beforeEach(() => {
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
