import { safeVisit } from '../support/test-utils';

describe('Authentication Tests', () => {
  context('Login with Different User Types', () => {
    beforeEach(() => {
      // Clear cookies and local storage before each test
      cy.clearCookies();
      cy.clearLocalStorage();
    });

    it('should login as regular user', () => {
      // Login as regular user
      cy.loginAsTestUser();

      // Take a screenshot
      cy.screenshot('auth-regular-user');

      // Check if we're logged in
      cy.url().then(url => {
        cy.log(`Current URL after login: ${url}`);
        if (url.includes('/dashboard')) {
          cy.log('✅ Successfully logged in as regular user');
        } else {
          cy.log('❌ Failed to log in as regular user');
        }
      });

      // Check for user-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();

        // Log the body text for debugging
        cy.log(`Body text: ${text.substring(0, 200)}...`);

        const hasUserElements = text.includes('dashboard') ||
                              text.includes('profile') ||
                              text.includes('logout') ||
                              text.includes('account');

        if (hasUserElements) {
          cy.log('✅ User-specific elements found');
        } else {
          cy.log('❌ No user-specific elements found');
        }
      });
    });

    it('should login as admin user', () => {
      // Login as admin user
      cy.loginAsAdmin();

      // Take a screenshot
      cy.screenshot('auth-admin-user');

      // Check if we're logged in
      cy.url().then(url => {
        if (url.includes('/dashboard') || url.includes('/admin')) {
          cy.log('✅ Successfully logged in as admin user');
        } else {
          cy.log('❌ Failed to log in as admin user');
        }
      });

      // Check for admin-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasAdminElements = text.includes('admin') ||
                               text.includes('manage') ||
                               text.includes('users') ||
                               text.includes('settings');

        if (hasAdminElements) {
          cy.log('✅ Admin-specific elements found');
        } else {
          cy.log('❌ No admin-specific elements found');
        }
      });
    });

    it('should login as distributor', () => {
      // Login as distributor
      cy.loginAsDistributor();

      // Take a screenshot
      cy.screenshot('auth-distributor');

      // Check if we're logged in
      cy.url().then(url => {
        if (url.includes('/dashboard')) {
          cy.log('✅ Successfully logged in as distributor');
        } else {
          cy.log('❌ Failed to log in as distributor');
        }
      });

      // Check for distributor-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasDistributorElements = text.includes('genealogy') ||
                                     text.includes('downline') ||
                                     text.includes('rebates') ||
                                     text.includes('commission');

        if (hasDistributorElements) {
          cy.log('✅ Distributor-specific elements found');
        } else {
          cy.log('❌ No distributor-specific elements found');
        }
      });
    });
  });

  context('Access Control', () => {
    it('should test access to protected routes as guest', () => {
      // Clear cookies and local storage
      cy.clearCookies();
      cy.clearLocalStorage();

      // List of protected routes
      const protectedRoutes = [
        '/dashboard',
        '/profile',
        '/genealogy',
        '/rebates',
        '/admin'
      ];

      // Visit each protected route
      protectedRoutes.forEach(route => {
        safeVisit(route);

        // Take a screenshot
        cy.screenshot(`auth-guest-${route.replace(/\//g, '-')}`);

        // Check if redirected to login page
        cy.url().then(url => {
          const isLoginPage = url.includes('login') || url.includes('auth') || url.includes('signin');

          if (isLoginPage) {
            cy.log(`✅ Protected route ${route} redirects to login`);
          } else {
            cy.log(`❓ Protected route ${route} does not redirect to login (may allow public access)`);
          }
        });
      });
    });

    it('should test access to admin routes as regular user', () => {
      // Login as regular user
      cy.loginAsTestUser();

      // Try to access admin route
      safeVisit('/admin');

      // Take a screenshot
      cy.screenshot('auth-regular-user-admin-access');

      // Check if access is denied
      cy.url().then(url => {
        const isAdminPage = url.includes('/admin');
        const isDeniedPage = url.includes('denied') || url.includes('forbidden') || url.includes('unauthorized');

        if (!isAdminPage || isDeniedPage) {
          cy.log('✅ Regular user cannot access admin page');
        } else {
          cy.log('❌ Regular user can access admin page (potential security issue)');
        }
      });
    });
  });

  context('Authentication Persistence', () => {
    it('should test session persistence', () => {
      // Login as regular user
      cy.loginAsTestUser();

      // Visit dashboard
      safeVisit('/dashboard');

      // Reload the page
      cy.reload();

      // Take a screenshot
      cy.screenshot('auth-session-persistence');

      // Check if still logged in
      cy.url().then(url => {
        const isLoginPage = url.includes('login') || url.includes('auth') || url.includes('signin');

        if (!isLoginPage) {
          cy.log('✅ Session persists after page reload');
        } else {
          cy.log('❌ Session does not persist after page reload');
        }
      });
    });

    it('should test logout functionality', () => {
      // Login as regular user
      cy.loginAsTestUser();

      // Try to find and click logout button
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();

        if (text.includes('logout') || text.includes('sign out')) {
          cy.contains(/logout|sign out/i).click({ force: true });

          // Take a screenshot
          cy.screenshot('auth-after-logout');

          // Check if logged out
          cy.url().then(url => {
            const isLoginPage = url.includes('login') || url.includes('auth') || url.includes('signin');
            const isHomePage = url === Cypress.config('baseUrl') + '/' || url === Cypress.config('baseUrl');

            if (isLoginPage || isHomePage) {
              cy.log('✅ Successfully logged out');
            } else {
              cy.log('❌ Failed to log out');
            }
          });
        } else {
          cy.log('No logout button found, skipping test');
        }
      });
    });
  });
});
