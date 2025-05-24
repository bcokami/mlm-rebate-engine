import {
  safeVisit,
  tryFind,
  tryFillForm,
  tryClick
} from '../support/test-utils';

describe('User Flows', () => {
  context('New Visitor Flow', () => {
    it('should simulate a new visitor browsing products', () => {
      // Visit home page
      safeVisit('/');
      cy.screenshot('user-flow-new-visitor-home');

      // Try to navigate to products page
      tryClick('a[href*="products"], a:contains("Products"), button:contains("Products")');

      // If navigation didn't work, visit products page directly
      cy.url().then(url => {
        if (!url.includes('products')) {
          safeVisit('/products');
        }
      });

      cy.screenshot('user-flow-new-visitor-products');

      // Try to view product details
      tryClick('.product, [data-testid*="product"], .card');
      cy.screenshot('user-flow-new-visitor-product-details');

      // Try to add product to cart
      tryClick('button:contains("Add to Cart"), button:contains("Buy")');
      cy.screenshot('user-flow-new-visitor-add-to-cart');

      // Try to view cart
      tryClick('a[href*="cart"], button:contains("Cart"), [data-testid*="cart"]');

      // If navigation didn't work, visit cart page directly
      cy.url().then(url => {
        if (!url.includes('cart')) {
          safeVisit('/cart');
        }
      });

      cy.screenshot('user-flow-new-visitor-cart');
    });

    it('should simulate a new visitor registering', () => {
      // Visit home page
      safeVisit('/');

      // Try to navigate to registration page
      tryClick('a[href*="register"], a:contains("Register"), a:contains("Sign up")');

      // If navigation didn't work, visit registration page directly
      cy.url().then(url => {
        if (!url.includes('register')) {
          safeVisit('/register');
        }
      });

      cy.screenshot('user-flow-new-visitor-register');

      // Try to fill registration form
      tryFillForm({
        'input[name="name"], input[placeholder*="name"], input[id*="name"]': 'Test User',
        'input[type="email"], input[name="email"], input[placeholder*="email"]': `test${Date.now()}@example.com`,
        'input[type="password"], input[name="password"], input[placeholder*="password"]': 'Password123',
        'input[name="confirmPassword"], input[placeholder*="confirm"], input[name="passwordConfirmation"]': 'Password123',
        'input[name*="sponsor"], input[name*="referral"], input[placeholder*="sponsor"]': '12345'
      });

      cy.screenshot('user-flow-new-visitor-register-filled');

      // Try to submit registration form (don't actually submit to avoid creating test accounts)
      // Just log that we would submit here
      cy.log('Would submit registration form here in a real test');
    });
  });

  context('Returning User Flow', () => {
    beforeEach(() => {
      // Login as test user before each test
      cy.loginAsTestUser();
    });

    it('should simulate a returning user checking their dashboard', () => {
      // Visit dashboard page
      safeVisit('/dashboard');

      // Take a screenshot
      cy.screenshot('user-flow-returning-user-dashboard');

      // Check for dashboard elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasDashboardElements = text.includes('welcome') ||
                                   text.includes('overview') ||
                                   text.includes('summary') ||
                                   text.includes('stats');

        if (hasDashboardElements) {
          cy.log('✅ Dashboard elements found');
        } else {
          cy.log('❌ No dashboard elements found');
        }
      });
    });

    it('should simulate a returning user checking their genealogy', () => {
      // Visit genealogy page directly (we're already logged in)
      safeVisit('/genealogy');

      // Take a screenshot
      cy.screenshot('user-flow-returning-user-genealogy');

      // Try to interact with genealogy tree
      tryClick('[data-testid*="node"], svg g, [aria-expanded]');
      cy.screenshot('user-flow-returning-user-genealogy-interaction');
    });

    it('should simulate a returning user checking their rebates', () => {
      // Visit rebates page directly (we're already logged in)
      safeVisit('/rebates');

      // Take a screenshot
      cy.screenshot('user-flow-returning-user-rebates');

      // Try to filter rebates
      tryFind('select, [data-testid*="filter"]', $filters => {
        if ($filters.length > 0) {
          cy.wrap($filters.eq(0)).select(1, { force: true });
        }
      });

      cy.screenshot('user-flow-returning-user-rebates-filtered');
    });

    it('should simulate a returning user updating their profile', () => {
      // Visit profile page
      safeVisit('/profile');

      // Take a screenshot
      cy.screenshot('user-flow-returning-user-profile');

      // Try to find and fill profile form fields
      tryFillForm({
        'input[name="name"], input[placeholder*="name"]': 'Updated Test User',
        'input[name="phone"], input[placeholder*="phone"], input[type="tel"]': '1234567890'
      });

      // Take a screenshot after filling form
      cy.screenshot('user-flow-returning-user-profile-filled');

      // Try to submit form (don't actually submit to avoid updating profile)
      // Just log that we would submit here
      cy.log('Would submit profile form here in a real test');
    });
  });

  context('Admin User Flow', () => {
    beforeEach(() => {
      // Login as admin user before each test
      cy.loginAsAdmin();
    });

    it('should simulate an admin user managing products', () => {
      // Visit admin products page directly (we're already logged in)
      safeVisit('/admin/products');

      // Take a screenshot
      cy.screenshot('user-flow-admin-products');

      // Try to add a new product (don't actually add to avoid creating test products)
      tryClick('button:contains("Add"), button:contains("New"), button:contains("Create")');
      cy.screenshot('user-flow-admin-add-product');

      // Try to fill product form
      tryFillForm({
        'input[name="name"], input[placeholder*="name"]': 'Test Product',
        'input[name="price"], input[placeholder*="price"]': '100',
        'input[name="pv"], input[placeholder*="pv"], input[placeholder*="point"]': '10',
        'textarea[name="description"], textarea[placeholder*="description"]': 'This is a test product'
      });

      // Take a screenshot after filling form
      cy.screenshot('user-flow-admin-product-form');

      // Try to cancel (don't actually submit to avoid creating test products)
      tryClick('button:contains("Cancel"), button:contains("Back")');
    });

    it('should simulate an admin user managing users', () => {
      // Visit admin users page directly (we're already logged in)
      safeVisit('/admin/users');

      // Take a screenshot
      cy.screenshot('user-flow-admin-users');

      // Try to search for a user
      tryFillForm({
        'input[type="search"], input[placeholder*="search"], input[name*="search"]': 'test'
      });

      // Take a screenshot after search
      cy.screenshot('user-flow-admin-search-user');

      // Try to view user details
      tryClick('a:contains("View"), a:contains("Details"), button:contains("View")');

      // Take a screenshot of user details
      cy.screenshot('user-flow-admin-user-details');
    });

    it('should simulate an admin user checking system settings', () => {
      // Visit admin settings page
      safeVisit('/admin/settings');

      // Take a screenshot
      cy.screenshot('user-flow-admin-settings');

      // Try to find and interact with settings
      tryFind('input[type="checkbox"], select, input[type="number"]', $settings => {
        if ($settings.length > 0) {
          cy.log(`Found ${$settings.length} settings controls`);

          // Try to interact with the first setting
          const $firstSetting = $settings.eq(0);
          const type = $firstSetting.attr('type');

          if (type === 'checkbox') {
            cy.wrap($firstSetting).check({ force: true }).uncheck({ force: true });
          } else if ($firstSetting.is('select')) {
            cy.wrap($firstSetting).select(1, { force: true });
          } else if (type === 'number') {
            cy.wrap($firstSetting).clear({ force: true }).type('10', { force: true });
          }
        } else {
          cy.log('No settings controls found');
        }
      });

      // Take a screenshot after interaction
      cy.screenshot('user-flow-admin-settings-interaction');
    });
  });
});
