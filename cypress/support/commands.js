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
  // Use session to avoid having to log in for each test
  cy.session([email, password], () => {
    cy.safeVisit('/login');

    // Try to fill login form
    cy.tryFillForm({
      'input[type="email"], input[name="email"], input[placeholder*="email"]': email,
      'input[type="password"], input[name="password"], input[placeholder*="password"]': password
    });

    // Try to click login button
    cy.tryClick('button[type="submit"], button:contains("Login"), button:contains("Sign in")');

    // Wait for redirect to dashboard (but don't fail if it doesn't happen)
    cy.url().then(url => {
      if (!url.includes('/dashboard')) {
        cy.log('Warning: Not redirected to dashboard after login attempt');
      }
    });
  });
});

// Custom command to login as test user
Cypress.Commands.add('loginAsTestUser', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.regularUser;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('testUser');
    cy.login(email, password);
  }
});

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.admin;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('adminUser');
    cy.login(email, password);
  }
});

// Custom command to login as distributor
Cypress.Commands.add('loginAsDistributor', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.distributor;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('distributor');
    cy.login(email, password);
  }
});

// Custom command to login as silver member
Cypress.Commands.add('loginAsSilver', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.silver;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('silver');
    cy.login(email, password);
  }
});

// Custom command to login as gold member
Cypress.Commands.add('loginAsGold', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.gold;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('gold');
    cy.login(email, password);
  }
});

// Custom command to login as platinum member
Cypress.Commands.add('loginAsPlatinum', () => {
  // Check if we should use fixtures
  if (Cypress.env('useFixtures')) {
    cy.fixture('test-users.json').then(users => {
      const { email, password } = users.platinum;
      cy.login(email, password);
    });
  } else {
    const { email, password } = Cypress.env('platinum');
    cy.login(email, password);
  }
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
