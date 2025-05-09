describe('Checkout Process', () => {
  beforeEach(() => {
    // Start at the cart page
    cy.visit('/cart');
  });

  it('should display the cart page', () => {
    // Take a screenshot of the cart page
    cy.screenshot('cart-page');
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all h1 elements
    cy.get('h1').each(($el) => {
      cy.log(`H1 text: ${$el.text()}`);
    });
    
    // Check for cart items
    cy.get('[data-testid*="cart-item"], .cart-item, tr').then(($items) => {
      cy.log(`Found ${$items.length} potential cart items`);
    });
  });

  it('should proceed to checkout if possible', () => {
    // Look for checkout button
    cy.get('button').contains(/checkout|proceed|continue/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.log(`Found checkout button: ${$btn.text()}`);
        cy.wrap($btn).click({force: true});
        cy.screenshot('after-checkout-click');
      } else {
        cy.log('No checkout button found');
        // Try to find any button that might be the checkout button
        cy.get('button, a.button, .btn').each(($button) => {
          cy.log(`Button found: ${$button.text()}`);
        });
      }
    });
    
    // Check if we're on the checkout page
    cy.url().then((url) => {
      cy.log(`Current URL: ${url}`);
      if (url.includes('checkout')) {
        cy.log('Successfully navigated to checkout page');
      }
    });
  });

  it('should fill checkout form if available', () => {
    // Try to navigate to checkout page first
    cy.get('button').contains(/checkout|proceed|continue/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.wrap($btn).click({force: true});
      }
    });
    
    // Look for form fields
    cy.get('input, select, textarea').then(($fields) => {
      cy.log(`Found ${$fields.length} form fields`);
      
      // Fill text inputs
      cy.get('input[type="text"], input[type="email"], input[type="tel"], textarea').each(($input) => {
        const name = $input.attr('name') || $input.attr('id') || 'unnamed';
        cy.log(`Filling input: ${name}`);
        cy.wrap($input).type(`Test ${name}`);
      });
      
      // Select dropdowns
      cy.get('select').each(($select) => {
        const name = $select.attr('name') || $select.attr('id') || 'unnamed';
        cy.log(`Selecting from dropdown: ${name}`);
        cy.wrap($select).select(1);
      });
      
      // Check checkboxes
      cy.get('input[type="checkbox"]').each(($checkbox) => {
        const name = $checkbox.attr('name') || $checkbox.attr('id') || 'unnamed';
        cy.log(`Checking checkbox: ${name}`);
        cy.wrap($checkbox).check({force: true});
      });
      
      // Select radio buttons
      cy.get('input[type="radio"]').each(($radio, index, $radios) => {
        // Only select the first radio in each group
        const name = $radio.attr('name');
        if (name && $radios.filter(`[name="${name}"]:checked`).length === 0) {
          cy.log(`Selecting radio: ${name}`);
          cy.wrap($radio).check({force: true});
        }
      });
    });
    
    // Take a screenshot after filling the form
    cy.screenshot('checkout-form-filled');
    
    // Try to submit the form
    cy.get('button[type="submit"], button').contains(/place order|submit|confirm|pay/i).then(($btn) => {
      if ($btn.length > 0) {
        cy.log(`Found submit button: ${$btn.text()}`);
        // Don't actually click to avoid creating test orders
        // cy.wrap($btn).click({force: true});
        cy.log('Would click submit button here in a real test');
      } else {
        cy.log('No submit button found');
      }
    });
  });
});
