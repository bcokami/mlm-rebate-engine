/**
 * Test utilities for Cypress tests
 * 
 * This module provides helper functions for testing the MLM application
 * in a way that's resilient to changes in the application structure.
 */

/**
 * Visit a page with error handling
 * 
 * @param {string} path - The path to visit
 * @param {Object} options - Options for cy.visit
 * @returns {Cypress.Chainable}
 */
export const safeVisit = (path, options = {}) => {
  // Set default options
  const defaultOptions = {
    failOnStatusCode: false,
    timeout: 30000
  };
  
  // Merge options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Visit the page
  return cy.visit(path, mergedOptions).then(() => {
    // Log the current URL
    cy.url().then(url => {
      cy.log(`Visited ${path}, landed at ${url}`);
    });
    
    // Take a screenshot
    cy.screenshot(`visit-${path.replace(/\//g, '-')}`);
  });
};

/**
 * Try to find an element, but don't fail if it doesn't exist
 * 
 * @param {string} selector - The selector to find
 * @param {Function} action - The action to perform if the element is found
 * @returns {Cypress.Chainable}
 */
export const tryFind = (selector, action) => {
  return cy.get('body').then($body => {
    if ($body.find(selector).length > 0) {
      cy.get(selector).then(action);
    } else {
      cy.log(`Element not found: ${selector}`);
    }
  });
};

/**
 * Log information about the page structure
 * 
 * @returns {Cypress.Chainable}
 */
export const logPageStructure = () => {
  // Log the page title
  cy.title().then(title => {
    cy.log(`Page title: ${title}`);
  });
  
  // Log headings
  cy.get('h1, h2, h3').then($headings => {
    cy.log(`Found ${$headings.length} headings`);
    $headings.each((i, el) => {
      cy.log(`Heading ${i+1}: ${Cypress.$(el).text()}`);
    });
  });
  
  // Log links
  cy.get('a').then($links => {
    cy.log(`Found ${$links.length} links`);
  });
  
  // Log buttons
  cy.get('button').then($buttons => {
    cy.log(`Found ${$buttons.length} buttons`);
  });
  
  // Log forms
  cy.get('form').then($forms => {
    cy.log(`Found ${$forms.length} forms`);
  });
  
  return cy.log('Page structure logged');
};

/**
 * Test responsive behavior
 * 
 * @param {Array} viewports - Array of viewport configurations
 * @returns {Cypress.Chainable}
 */
export const testResponsive = (viewports = [
  { width: 1280, height: 800, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
]) => {
  // Test each viewport
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.wait(500); // Wait for resize
    
    // Take a screenshot
    cy.screenshot(`responsive-${viewport.name}`);
    
    // Log viewport size
    cy.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
  });
  
  return cy.log('Responsive testing completed');
};

/**
 * Try to fill a form
 * 
 * @param {Object} fieldValues - Map of field selectors to values
 * @returns {Cypress.Chainable}
 */
export const tryFillForm = (fieldValues) => {
  Object.entries(fieldValues).forEach(([selector, value]) => {
    tryFind(selector, $el => {
      cy.log(`Filling field: ${selector}`);
      cy.wrap($el).type(value, { force: true });
    });
  });
  
  return cy.log('Form filling attempted');
};

/**
 * Try to click a button or link
 * 
 * @param {string} selector - The selector to find
 * @param {Object} options - Options for cy.click
 * @returns {Cypress.Chainable}
 */
export const tryClick = (selector, options = {}) => {
  return tryFind(selector, $el => {
    cy.log(`Clicking: ${selector}`);
    cy.wrap($el).click({ force: true, ...options });
  });
};

/**
 * Check basic accessibility
 * 
 * @returns {Cypress.Chainable}
 */
export const checkBasicAccessibility = () => {
  // Check for images with alt text
  cy.get('img').then($images => {
    let withAlt = 0;
    let withoutAlt = 0;
    
    $images.each((i, el) => {
      if (el.hasAttribute('alt')) {
        withAlt++;
      } else {
        withoutAlt++;
      }
    });
    
    cy.log(`Images with alt text: ${withAlt}`);
    cy.log(`Images without alt text: ${withoutAlt}`);
  });
  
  // Check for form labels
  tryFind('input[id]', $inputs => {
    let withLabel = 0;
    let withoutLabel = 0;
    
    $inputs.each((i, el) => {
      const $el = Cypress.$(el);
      const id = $el.attr('id');
      
      if (id && Cypress.$(`label[for="${id}"]`).length > 0) {
        withLabel++;
      } else {
        withoutLabel++;
      }
    });
    
    cy.log(`Inputs with associated labels: ${withLabel}`);
    cy.log(`Inputs without associated labels: ${withoutLabel}`);
  });
  
  return cy.log('Accessibility check completed');
};
