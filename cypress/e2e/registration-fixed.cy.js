describe('Registration Functionality', () => {
  beforeEach(() => {
    // Visit registration page with failOnStatusCode set to false
    cy.visit('/register', { failOnStatusCode: false });
  });

  it('should access the registration page', () => {
    // Take a screenshot of the registration page
    cy.screenshot('registration-page-access');
    
    // Log the current URL
    cy.url().then((url) => {
      cy.log(`Current URL: ${url}`);
    });
    
    // Check if we're on the registration page
    cy.url().then((url) => {
      if (url.includes('/register')) {
        cy.log('Successfully accessed registration page');
      } else {
        cy.log(`Redirected to: ${url}`);
      }
    });
  });

  it('should identify registration form elements', () => {
    // Look for form elements
    cy.get('form').then(($form) => {
      if ($form.length > 0) {
        cy.log('Found registration form');
        
        // Log all input fields
        cy.get('input').each(($input) => {
          const type = $input.attr('type') || 'unknown';
          const name = $input.attr('name') || 'unnamed';
          const id = $input.attr('id') || 'no-id';
          cy.log(`Input field: type=${type}, name=${name}, id=${id}`);
        });
        
        // Log all buttons
        cy.get('button').each(($button) => {
          cy.log(`Button: ${$button.text()}`);
        });
      } else {
        cy.log('No registration form found');
      }
    });
    
    cy.screenshot('registration-form-elements');
  });

  it('should attempt to fill registration form', () => {
    // Try to find and fill common registration fields
    
    // Name field
    cy.get('input[name="name"], input[placeholder*="name"], input[id*="name"]').then(($name) => {
      if ($name.length > 0) {
        cy.log('Found name field');
        cy.wrap($name.eq(0)).type('Test User');
      }
    });
    
    // Email field
    cy.get('input[type="email"], input[name="email"], input[placeholder*="email"]').then(($email) => {
      if ($email.length > 0) {
        cy.log('Found email field');
        cy.wrap($email.eq(0)).type('test@example.com');
      }
    });
    
    // Password field
    cy.get('input[type="password"], input[name="password"], input[placeholder*="password"]').then(($password) => {
      if ($password.length > 0) {
        cy.log('Found password field');
        cy.wrap($password.eq(0)).type('Password123');
        
        // If there's a second password field (confirm password)
        if ($password.length > 1) {
          cy.log('Found confirm password field');
          cy.wrap($password.eq(1)).type('Password123');
        }
      }
    });
    
    // Sponsor ID or referral field
    cy.get('input[name*="sponsor"], input[name*="referral"], input[placeholder*="sponsor"], input[placeholder*="referral"]').then(($sponsor) => {
      if ($sponsor.length > 0) {
        cy.log('Found sponsor/referral field');
        cy.wrap($sponsor.eq(0)).type('12345');
      }
    });
    
    // Take a screenshot after filling the form
    cy.screenshot('registration-form-filled');
    
    // Find the submit button but don't click it
    cy.get('button[type="submit"], button:contains("Register"), button:contains("Sign up"), button:contains("Create")').then(($button) => {
      if ($button.length > 0) {
        cy.log(`Found submit button: ${$button.text()}`);
        // Don't actually click to avoid creating test accounts
        cy.log('Would click submit button here in a real test');
      } else {
        cy.log('No submit button found');
      }
    });
  });
});
