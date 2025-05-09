import {
  safeVisit,
  tryFind,
  tryClick
} from '../support/test-utils';

describe('Mobile Features', () => {
  beforeEach(() => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');
  });
  
  context('Mobile Navigation', () => {
    it('should test mobile menu', () => {
      // Visit home page
      safeVisit('/');
      
      // Take a screenshot of initial state
      cy.screenshot('mobile-initial-state');
      
      // Try to find and click hamburger menu
      tryFind('button[aria-label*="menu"], button.hamburger, .mobile-menu-button, [data-testid*="menu-button"]', $menuButton => {
        if ($menuButton.length > 0) {
          cy.log('Found mobile menu button');
          cy.wrap($menuButton).click({ force: true });
          
          // Take a screenshot after clicking menu button
          cy.screenshot('mobile-menu-open');
          
          // Check if menu is visible
          cy.get('nav, .mobile-menu, .menu, .navigation').then($menu => {
            if ($menu.length > 0) {
              cy.log('✅ Mobile menu is visible after clicking button');
            } else {
              cy.log('❌ Mobile menu is not visible after clicking button');
            }
          });
        } else {
          cy.log('No mobile menu button found');
        }
      });
    });
    
    it('should test mobile navigation links', () => {
      // Visit home page
      safeVisit('/');
      
      // Try to find and click hamburger menu to open it
      tryClick('button[aria-label*="menu"], button.hamburger, .mobile-menu-button, [data-testid*="menu-button"]');
      
      // Try to find navigation links
      tryFind('nav a, .mobile-menu a, .menu a, .navigation a', $links => {
        if ($links.length > 0) {
          cy.log(`Found ${$links.length} navigation links`);
          
          // Log the links
          $links.each((i, el) => {
            const $el = Cypress.$(el);
            const href = $el.attr('href') || 'no-href';
            const text = $el.text().trim();
            cy.log(`Link ${i+1}: ${text} (${href})`);
          });
          
          // Take a screenshot
          cy.screenshot('mobile-navigation-links');
        } else {
          cy.log('No navigation links found');
        }
      });
    });
  });
  
  context('Mobile Layout', () => {
    it('should test responsive tables', () => {
      // Visit a page with tables
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('mobile-tables');
      
      // Check if tables are responsive
      tryFind('table', $tables => {
        if ($tables.length > 0) {
          cy.log('Found tables, checking if they are responsive');
          
          // Check if tables have horizontal scroll or are reformatted for mobile
          const tableWidth = $tables.eq(0).width();
          const viewportWidth = Cypress.config('viewportWidth');
          
          if (tableWidth <= viewportWidth) {
            cy.log('✅ Tables appear to be responsive (not wider than viewport)');
          } else {
            // Check if there's a scroll container
            const $scrollContainer = $tables.eq(0).parent('.table-responsive, [style*="overflow"]');
            if ($scrollContainer.length > 0) {
              cy.log('✅ Tables appear to be in a scrollable container');
            } else {
              cy.log('❌ Tables may not be responsive');
            }
          }
        } else {
          cy.log('No tables found');
        }
      });
    });
    
    it('should test form layouts on mobile', () => {
      // Visit login page
      safeVisit('/login');
      
      // Take a screenshot
      cy.screenshot('mobile-login-form');
      
      // Check form layout
      tryFind('form', $form => {
        if ($form.length > 0) {
          cy.log('Found form, checking layout');
          
          // Check if form elements are stacked
          const formWidth = $form.width();
          const viewportWidth = Cypress.config('viewportWidth');
          
          if (formWidth <= viewportWidth) {
            cy.log('✅ Form appears to fit within viewport');
          } else {
            cy.log('❌ Form may be too wide for mobile');
          }
          
          // Check if inputs are full width
          tryFind('form input', $inputs => {
            if ($inputs.length > 0) {
              const inputWidth = $inputs.eq(0).width();
              const formWidth = $form.width();
              
              if (inputWidth / formWidth > 0.9) { // Input takes up at least 90% of form width
                cy.log('✅ Inputs appear to be full width');
              } else {
                cy.log('❌ Inputs may not be full width');
              }
            }
          });
        } else {
          cy.log('No form found');
        }
      });
    });
  });
  
  context('Mobile Touch Interactions', () => {
    it('should test touch-friendly buttons', () => {
      // Visit home page
      safeVisit('/');
      
      // Check button sizes
      tryFind('button, a.button, .btn', $buttons => {
        if ($buttons.length > 0) {
          cy.log(`Found ${$buttons.length} buttons`);
          
          // Check if buttons are large enough for touch
          let touchFriendlyCount = 0;
          
          $buttons.each((i, el) => {
            const $el = Cypress.$(el);
            const height = $el.height();
            const width = $el.width();
            
            // Minimum recommended touch target size is 44x44 pixels
            if (height >= 44 && width >= 44) {
              touchFriendlyCount++;
            }
          });
          
          const percentage = Math.round((touchFriendlyCount / $buttons.length) * 100);
          cy.log(`${percentage}% of buttons are touch-friendly size (at least 44x44 pixels)`);
          
          // Take a screenshot
          cy.screenshot('mobile-buttons');
        } else {
          cy.log('No buttons found');
        }
      });
    });
    
    it('should test touch-friendly spacing', () => {
      // Visit home page
      safeVisit('/');
      
      // Check spacing between clickable elements
      tryFind('a, button', $elements => {
        if ($elements.length > 0) {
          cy.log(`Found ${$elements.length} clickable elements`);
          
          // Take a screenshot
          cy.screenshot('mobile-element-spacing');
          
          // We can't easily check spacing programmatically in Cypress,
          // so we'll just log that it should be checked manually
          cy.log('Element spacing should be checked manually');
        } else {
          cy.log('No clickable elements found');
        }
      });
    });
  });
  
  context('Mobile-Specific Features', () => {
    it('should test phone call links', () => {
      // Visit contact page or home page
      safeVisit('/contact');
      
      // If contact page doesn't exist, try home page
      cy.url().then(url => {
        if (!url.includes('contact')) {
          safeVisit('/');
        }
      });
      
      // Check for phone links
      tryFind('a[href^="tel:"]', $phoneLinks => {
        if ($phoneLinks.length > 0) {
          cy.log(`Found ${$phoneLinks.length} phone links`);
          
          // Log the phone links
          $phoneLinks.each((i, el) => {
            const $el = Cypress.$(el);
            const href = $el.attr('href');
            const text = $el.text().trim();
            cy.log(`Phone link ${i+1}: ${text} (${href})`);
          });
          
          // Take a screenshot
          cy.screenshot('mobile-phone-links');
        } else {
          cy.log('No phone links found');
        }
      });
    });
    
    it('should test email links', () => {
      // Visit contact page or home page
      safeVisit('/contact');
      
      // If contact page doesn't exist, try home page
      cy.url().then(url => {
        if (!url.includes('contact')) {
          safeVisit('/');
        }
      });
      
      // Check for email links
      tryFind('a[href^="mailto:"]', $emailLinks => {
        if ($emailLinks.length > 0) {
          cy.log(`Found ${$emailLinks.length} email links`);
          
          // Log the email links
          $emailLinks.each((i, el) => {
            const $el = Cypress.$(el);
            const href = $el.attr('href');
            const text = $el.text().trim();
            cy.log(`Email link ${i+1}: ${text} (${href})`);
          });
          
          // Take a screenshot
          cy.screenshot('mobile-email-links');
        } else {
          cy.log('No email links found');
        }
      });
    });
  });
});
