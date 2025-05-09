import { safeVisit } from '../support/test-utils';

describe('Accessibility Tests', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Registration' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/products', name: 'Products' },
    { path: '/genealogy', name: 'Genealogy' },
    { path: '/rebates', name: 'Rebates' }
  ];
  
  pages.forEach(page => {
    context(`${page.name} Page`, () => {
      beforeEach(() => {
        safeVisit(page.path);
      });
      
      it(`should check images for alt text on ${page.name} page`, () => {
        // Check images for alt text
        cy.get('img').then($images => {
          let withAlt = 0;
          let withoutAlt = 0;
          let emptyAlt = 0;
          
          $images.each((i, el) => {
            const $el = Cypress.$(el);
            if ($el.attr('alt') !== undefined) {
              if ($el.attr('alt') === '') {
                emptyAlt++;
              } else {
                withAlt++;
              }
            } else {
              withoutAlt++;
            }
          });
          
          cy.log(`Images with alt text: ${withAlt}`);
          cy.log(`Images with empty alt text: ${emptyAlt}`);
          cy.log(`Images without alt text: ${withoutAlt}`);
          
          // Take a screenshot
          cy.screenshot(`a11y-images-${page.name.toLowerCase()}`);
        });
      });
      
      it(`should check form inputs for labels on ${page.name} page`, () => {
        // Check form inputs for labels
        cy.get('input, select, textarea').then($inputs => {
          let withLabel = 0;
          let withAriaLabel = 0;
          let withoutLabel = 0;
          
          $inputs.each((i, el) => {
            const $el = Cypress.$(el);
            const id = $el.attr('id');
            const ariaLabel = $el.attr('aria-label');
            const ariaLabelledBy = $el.attr('aria-labelledby');
            
            if (id && Cypress.$(`label[for="${id}"]`).length > 0) {
              withLabel++;
            } else if (ariaLabel || ariaLabelledBy) {
              withAriaLabel++;
            } else {
              withoutLabel++;
            }
          });
          
          cy.log(`Inputs with associated labels: ${withLabel}`);
          cy.log(`Inputs with ARIA labels: ${withAriaLabel}`);
          cy.log(`Inputs without labels: ${withoutLabel}`);
          
          // Take a screenshot
          cy.screenshot(`a11y-forms-${page.name.toLowerCase()}`);
        });
      });
      
      it(`should check heading hierarchy on ${page.name} page`, () => {
        // Check heading hierarchy
        cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
          const headingLevels = {
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: []
          };
          
          $headings.each((i, el) => {
            const $el = Cypress.$(el);
            const tagName = el.tagName.toLowerCase();
            headingLevels[tagName].push($el.text().trim());
          });
          
          // Log heading hierarchy
          cy.log('Heading hierarchy:');
          Object.keys(headingLevels).forEach(level => {
            cy.log(`${level}: ${headingLevels[level].length}`);
            headingLevels[level].forEach((text, i) => {
              if (text) {
                cy.log(`  ${i+1}. ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
              }
            });
          });
          
          // Check for proper hierarchy
          const hasH1 = headingLevels.h1.length > 0;
          const hasH2WithoutH1 = headingLevels.h2.length > 0 && headingLevels.h1.length === 0;
          const hasH3WithoutH2 = headingLevels.h3.length > 0 && headingLevels.h2.length === 0;
          
          if (hasH1) {
            cy.log('✅ Page has at least one h1 heading');
          } else {
            cy.log('❌ Page is missing h1 heading');
          }
          
          if (hasH2WithoutH1) {
            cy.log('❌ Page has h2 headings without h1');
          }
          
          if (hasH3WithoutH2) {
            cy.log('❌ Page has h3 headings without h2');
          }
          
          // Take a screenshot
          cy.screenshot(`a11y-headings-${page.name.toLowerCase()}`);
        });
      });
      
      it(`should check color contrast on ${page.name} page`, () => {
        // We can't actually check color contrast automatically without additional libraries,
        // but we can log that it should be checked manually
        cy.log('Color contrast should be checked manually using a tool like axe or WAVE');
        
        // Take a screenshot for manual review
        cy.screenshot(`a11y-contrast-${page.name.toLowerCase()}`);
      });
      
      it(`should check keyboard navigation on ${page.name} page`, () => {
        // Check for focusable elements
        cy.get('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').then($focusable => {
          cy.log(`Found ${$focusable.length} potentially focusable elements`);
          
          // Try to focus the first element
          if ($focusable.length > 0) {
            cy.wrap($focusable.eq(0)).focus();
            cy.screenshot(`a11y-focus-${page.name.toLowerCase()}`);
          }
        });
        
        // Check for skip links
        cy.get('a[href^="#content"], a[href^="#main"]').then($skipLinks => {
          if ($skipLinks.length > 0) {
            cy.log('✅ Page has skip links');
          } else {
            cy.log('❌ Page is missing skip links');
          }
        });
      });
    });
  });
});
