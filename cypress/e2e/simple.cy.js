describe('Simple Test', () => {
  it('should visit the home page', () => {
    cy.visit('/');
    cy.log('Successfully visited the home page');
  });
});
