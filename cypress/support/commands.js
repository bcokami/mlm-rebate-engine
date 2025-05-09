// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import test utilities
import {
  safeVisit,
  tryFind,
  logPageStructure,
  testResponsive,
  tryFillForm,
  tryClick,
  checkBasicAccessibility
} from './test-utils';

// Add test utilities as Cypress commands
Cypress.Commands.add('safeVisit', safeVisit);
Cypress.Commands.add('tryFind', tryFind);
Cypress.Commands.add('logPageStructure', logPageStructure);
Cypress.Commands.add('testResponsive', testResponsive);
Cypress.Commands.add('tryFillForm', tryFillForm);
Cypress.Commands.add('tryClick', tryClick);
Cypress.Commands.add('checkBasicAccessibility', checkBasicAccessibility);

// Custom command to login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Wait for redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
});

// Custom command to login as test user
Cypress.Commands.add('loginAsTestUser', () => {
  const { email, password } = Cypress.env('testUser');
  cy.login(email, password);
});

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  const { email, password } = Cypress.env('adminUser');
  cy.login(email, password);
});

// Custom command to check if element is visible in viewport
Cypress.Commands.add('isVisibleInViewport', { prevSubject: true }, (subject) => {
  const rect = subject[0].getBoundingClientRect();

  expect(rect.top).to.be.at.least(0);
  expect(rect.left).to.be.at.least(0);
  expect(rect.bottom).to.be.at.most(Cypress.config('viewportHeight'));
  expect(rect.right).to.be.at.most(Cypress.config('viewportWidth'));

  return subject;
});

// Custom command to check performance metrics
Cypress.Commands.add('checkPerformance', () => {
  cy.window().then((win) => {
    if (win.performance && win.performance.getEntriesByType) {
      const performanceEntries = win.performance.getEntriesByType('navigation');
      if (performanceEntries && performanceEntries.length > 0) {
        const navigationEntry = performanceEntries[0];

        // Log performance metrics
        cy.log(`Page Load Time: ${navigationEntry.loadEventEnd - navigationEntry.startTime}ms`);
        cy.log(`DOM Content Loaded: ${navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime}ms`);

        const firstPaint = win.performance.getEntriesByName('first-paint');
        if (firstPaint && firstPaint.length > 0) {
          cy.log(`First Paint: ${firstPaint[0].startTime}ms`);
        } else {
          cy.log('First Paint: N/A');
        }

        // Assert that page load time is reasonable
        expect(navigationEntry.loadEventEnd - navigationEntry.startTime).to.be.lessThan(10000);
      }
    }
  });
});

// Custom command to test responsive behavior
Cypress.Commands.add('testResponsive', (sizes = ['iphone-6', 'ipad-2', 'macbook-13']) => {
  sizes.forEach((size) => {
    cy.viewport(size);
    cy.wait(500); // Wait for resize
    cy.screenshot(`responsive-${size}`);
  });
});

// Custom command to add a product to cart
Cypress.Commands.add('addProductToCart', (productId) => {
  cy.visit(`/products/${productId}`);
  cy.get('button').contains('Add to Cart').click();
  cy.get('[data-testid="cart-count"]').should('be.visible');
});
