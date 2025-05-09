import {
  safeVisit,
  tryFind,
  logPageStructure,
  testResponsive,
  tryFillForm,
  tryClick,
  checkBasicAccessibility
} from '../support/test-utils';

describe('MLM Application Comprehensive Tests', () => {
  context('Home Page', () => {
    beforeEach(() => {
      safeVisit('/');
    });
    
    it('should load the home page', () => {
      // Check that the page loaded
      cy.get('body').should('exist');
      cy.log('Home page loaded successfully');
    });
    
    it('should analyze home page structure', () => {
      // Log page structure
      logPageStructure();
    });
    
    it('should test responsive behavior', () => {
      // Test responsive behavior
      testResponsive();
    });
    
    it('should check accessibility', () => {
      // Check accessibility
      checkBasicAccessibility();
    });
    
    it('should try to interact with navigation', () => {
      // Try to find and click navigation links
      tryFind('nav a, header a, .navbar a', $links => {
        if ($links.length > 0) {
          cy.log(`Found ${$links.length} navigation links`);
          // Don't actually click to avoid navigation issues
        }
      });
    });
  });
  
  context('Authentication', () => {
    it('should try to access login page', () => {
      safeVisit('/login');
      
      // Try to find login form
      tryFind('form, input[type="email"], input[type="password"]', $form => {
        cy.log('Found login form elements');
      });
    });
    
    it('should try to login', () => {
      safeVisit('/login');
      
      // Try to fill login form
      tryFillForm({
        'input[type="email"], input[name="email"]': 'test@example.com',
        'input[type="password"], input[name="password"]': 'password123'
      });
      
      // Try to click login button
      tryClick('button[type="submit"], button:contains("Login"), button:contains("Sign in")');
      
      // Take a screenshot after login attempt
      cy.screenshot('after-login-attempt');
    });
    
    it('should try to access registration page', () => {
      safeVisit('/register');
      
      // Try to find registration form
      tryFind('form, input[type="text"], input[type="email"], input[type="password"]', $form => {
        cy.log('Found registration form elements');
      });
    });
    
    it('should try to register', () => {
      safeVisit('/register');
      
      // Try to fill registration form
      tryFillForm({
        'input[name="name"], input[placeholder*="name"]': 'Test User',
        'input[type="email"], input[name="email"]': 'test@example.com',
        'input[type="password"], input[name="password"]': 'password123',
        'input[name="confirmPassword"], input[placeholder*="confirm"]': 'password123'
      });
      
      // Try to click register button
      tryClick('button[type="submit"], button:contains("Register"), button:contains("Sign up")');
      
      // Take a screenshot after registration attempt
      cy.screenshot('after-registration-attempt');
    });
  });
  
  context('Products', () => {
    it('should try to access products page', () => {
      safeVisit('/products');
      
      // Try to find product listings
      tryFind('.product, [data-testid*="product"], .card', $products => {
        cy.log(`Found ${$products.length} product elements`);
      });
    });
    
    it('should try to interact with products', () => {
      safeVisit('/products');
      
      // Try to click on a product
      tryClick('.product, [data-testid*="product"], .card');
      
      // Try to add to cart
      tryClick('button:contains("Add to Cart"), button:contains("Buy")');
      
      // Take a screenshot
      cy.screenshot('product-interaction');
    });
  });
  
  context('Genealogy', () => {
    it('should try to access genealogy page', () => {
      safeVisit('/genealogy');
      
      // Try to find genealogy visualization
      tryFind('svg, canvas, [data-testid*="tree"], [data-testid*="genealogy"]', $tree => {
        cy.log(`Found ${$tree.length} genealogy visualization elements`);
      });
    });
    
    it('should try to interact with genealogy tree', () => {
      safeVisit('/genealogy');
      
      // Try to click on a tree node
      tryClick('[data-testid*="node"], svg g, [aria-expanded]');
      
      // Try to use filters
      tryFind('select, [data-testid*="filter"]', $filters => {
        if ($filters.length > 0) {
          cy.log(`Found ${$filters.length} filter elements`);
          // Try to use the first filter
          cy.wrap($filters.eq(0)).select(1, { force: true });
        }
      });
      
      // Take a screenshot
      cy.screenshot('genealogy-interaction');
    });
  });
  
  context('Rebates', () => {
    it('should try to access rebates page', () => {
      safeVisit('/rebates');
      
      // Try to find rebate listings
      tryFind('table, [data-testid*="rebate"], .rebate', $rebates => {
        cy.log(`Found ${$rebates.length} rebate elements`);
      });
    });
    
    it('should try to filter rebates', () => {
      safeVisit('/rebates');
      
      // Try to use filters
      tryFind('select, [data-testid*="filter"]', $filters => {
        if ($filters.length > 0) {
          cy.log(`Found ${$filters.length} filter elements`);
          // Try to use the first filter
          cy.wrap($filters.eq(0)).select(1, { force: true });
        }
      });
      
      // Take a screenshot
      cy.screenshot('rebates-filtering');
    });
  });
  
  context('Checkout', () => {
    it('should try to access cart page', () => {
      safeVisit('/cart');
      
      // Try to find cart items
      tryFind('[data-testid*="cart-item"], .cart-item', $items => {
        cy.log(`Found ${$items.length} cart items`);
      });
    });
    
    it('should try to proceed to checkout', () => {
      safeVisit('/cart');
      
      // Try to click checkout button
      tryClick('button:contains("Checkout"), button:contains("Proceed")');
      
      // Take a screenshot
      cy.screenshot('checkout-attempt');
    });
  });
});
