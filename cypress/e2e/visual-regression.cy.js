import { safeVisit, testResponsive } from '../support/test-utils';

describe('Visual Regression Tests', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Registration' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/products', name: 'Products' },
    { path: '/genealogy', name: 'Genealogy' },
    { path: '/rebates', name: 'Rebates' },
    { path: '/cart', name: 'Cart' }
  ];
  
  pages.forEach(page => {
    context(`${page.name} Page`, () => {
      beforeEach(() => {
        safeVisit(page.path);
      });
      
      it(`should capture ${page.name} page in desktop view`, () => {
        cy.viewport(1280, 800);
        cy.wait(500); // Wait for resize
        cy.screenshot(`visual-${page.name.toLowerCase()}-desktop`);
      });
      
      it(`should capture ${page.name} page in tablet view`, () => {
        cy.viewport(768, 1024);
        cy.wait(500); // Wait for resize
        cy.screenshot(`visual-${page.name.toLowerCase()}-tablet`);
      });
      
      it(`should capture ${page.name} page in mobile view`, () => {
        cy.viewport(375, 667);
        cy.wait(500); // Wait for resize
        cy.screenshot(`visual-${page.name.toLowerCase()}-mobile`);
      });
    });
  });
  
  context('Interactive Elements', () => {
    it('should capture hover states', () => {
      safeVisit('/');
      
      // Try to find and hover over buttons
      cy.get('button').then($buttons => {
        if ($buttons.length > 0) {
          cy.wrap($buttons.eq(0)).trigger('mouseover', { force: true });
          cy.wait(500); // Wait for hover effect
          cy.screenshot('visual-button-hover');
        }
      });
      
      // Try to find and hover over links
      cy.get('a').then($links => {
        if ($links.length > 0) {
          cy.wrap($links.eq(0)).trigger('mouseover', { force: true });
          cy.wait(500); // Wait for hover effect
          cy.screenshot('visual-link-hover');
        }
      });
    });
    
    it('should capture form interactions', () => {
      safeVisit('/login');
      
      // Try to find and focus on input fields
      cy.get('input').then($inputs => {
        if ($inputs.length > 0) {
          cy.wrap($inputs.eq(0)).focus();
          cy.wait(500); // Wait for focus effect
          cy.screenshot('visual-input-focus');
        }
      });
    });
  });
});
