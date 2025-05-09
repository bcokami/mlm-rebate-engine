describe('Registration Page', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should display the registration page', () => {
    // Take a screenshot of the registration page
    cy.screenshot('registration-page');
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all h1 elements
    cy.get('h1').each(($el) => {
      cy.log(`H1 text: ${$el.text()}`);
    });
    
    // Log all form elements
    cy.get('form').each(($form, index) => {
      cy.log(`Form ${index} found`);
      cy.wrap($form).find('input').each(($input) => {
        cy.log(`Input: ${$input.attr('name') || 'unnamed'}, type: ${$input.attr('type')}`);
      });
    });
  });

  it('should capture form interactions', () => {
    // Find all input fields and interact with them
    cy.get('input').each(($input, index) => {
      const inputType = $input.attr('type');
      const inputName = $input.attr('name') || `unnamed-${index}`;
      
      cy.log(`Interacting with input: ${inputName}, type: ${inputType}`);
      
      if (inputType === 'text' || inputType === 'email' || inputType === 'password') {
        cy.wrap($input).type(`Test value for ${inputName}`);
      } else if (inputType === 'checkbox') {
        cy.wrap($input).check();
      }
    });
    
    // Take a screenshot after filling the form
    cy.screenshot('registration-form-filled');
    
    // Find and click the submit button
    cy.get('button[type="submit"]').then(($btn) => {
      if ($btn.length > 0) {
        cy.log(`Submit button found with text: ${$btn.text()}`);
        cy.wrap($btn).click();
      } else {
        cy.log('No submit button found');
        // Try to find any button that might be the submit button
        cy.get('button').each(($button) => {
          cy.log(`Button found: ${$button.text()}`);
        });
      }
    });
  });
});
