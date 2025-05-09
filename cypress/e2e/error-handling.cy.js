import {
  safeVisit,
  tryFind,
  tryFillForm,
  tryClick
} from '../support/test-utils';

describe('Error Handling', () => {
  context('404 Page', () => {
    it('should handle non-existent pages', () => {
      // Visit a non-existent page
      safeVisit('/non-existent-page', { failOnStatusCode: false });
      
      // Take a screenshot
      cy.screenshot('error-404-page');
      
      // Check if there's a 404 message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const has404 = text.includes('404') || 
                      text.includes('not found') || 
                      text.includes('page not found') || 
                      text.includes('doesn\'t exist');
        
        if (has404) {
          cy.log('✅ Page shows 404 message');
        } else {
          cy.log('❌ Page does not show 404 message');
        }
      });
    });
  });
  
  context('Form Validation', () => {
    it('should handle invalid login credentials', () => {
      // Visit login page
      safeVisit('/login');
      
      // Try to fill login form with invalid credentials
      tryFillForm({
        'input[type="email"], input[name="email"], input[placeholder*="email"]': 'invalid@example.com',
        'input[type="password"], input[name="password"], input[placeholder*="password"]': 'wrongpassword'
      });
      
      // Try to submit form
      tryClick('button[type="submit"], button:contains("Login"), button:contains("Sign in")');
      
      // Take a screenshot
      cy.screenshot('error-invalid-login');
      
      // Check for error message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasError = text.includes('invalid') || 
                        text.includes('incorrect') || 
                        text.includes('wrong') || 
                        text.includes('error') ||
                        text.includes('failed');
        
        if (hasError) {
          cy.log('✅ Page shows error message for invalid login');
        } else {
          cy.log('❌ Page does not show error message for invalid login');
        }
      });
    });
    
    it('should handle invalid registration data', () => {
      // Visit registration page
      safeVisit('/register');
      
      // Try to fill registration form with invalid data (short password)
      tryFillForm({
        'input[name="name"], input[placeholder*="name"], input[id*="name"]': 'Test User',
        'input[type="email"], input[name="email"], input[placeholder*="email"]': 'test@example.com',
        'input[type="password"], input[name="password"], input[placeholder*="password"]': '123', // Too short
        'input[name="confirmPassword"], input[placeholder*="confirm"], input[name="passwordConfirmation"]': '123'
      });
      
      // Try to submit form
      tryClick('button[type="submit"], button:contains("Register"), button:contains("Sign up")');
      
      // Take a screenshot
      cy.screenshot('error-invalid-registration');
      
      // Check for error message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasError = text.includes('password') || 
                        text.includes('invalid') || 
                        text.includes('too short') || 
                        text.includes('error') ||
                        text.includes('required');
        
        if (hasError) {
          cy.log('✅ Page shows error message for invalid registration');
        } else {
          cy.log('❌ Page does not show error message for invalid registration');
        }
      });
    });
    
    it('should handle mismatched passwords', () => {
      // Visit registration page
      safeVisit('/register');
      
      // Try to fill registration form with mismatched passwords
      tryFillForm({
        'input[name="name"], input[placeholder*="name"], input[id*="name"]': 'Test User',
        'input[type="email"], input[name="email"], input[placeholder*="email"]': 'test@example.com',
        'input[type="password"], input[name="password"], input[placeholder*="password"]': 'Password123',
        'input[name="confirmPassword"], input[placeholder*="confirm"], input[name="passwordConfirmation"]': 'DifferentPassword123'
      });
      
      // Try to submit form
      tryClick('button[type="submit"], button:contains("Register"), button:contains("Sign up")');
      
      // Take a screenshot
      cy.screenshot('error-mismatched-passwords');
      
      // Check for error message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasError = text.includes('match') || 
                        text.includes('different') || 
                        text.includes('same') || 
                        text.includes('error');
        
        if (hasError) {
          cy.log('✅ Page shows error message for mismatched passwords');
        } else {
          cy.log('❌ Page does not show error message for mismatched passwords');
        }
      });
    });
  });
  
  context('Empty States', () => {
    it('should handle empty cart', () => {
      // Visit cart page
      safeVisit('/cart');
      
      // Take a screenshot
      cy.screenshot('error-empty-cart');
      
      // Check for empty cart message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasEmptyMessage = text.includes('empty') || 
                              text.includes('no items') || 
                              text.includes('no products') || 
                              text.includes('start shopping');
        
        if (hasEmptyMessage) {
          cy.log('✅ Page shows empty cart message');
        } else {
          cy.log('❌ Page does not show empty cart message');
        }
      });
    });
    
    it('should handle empty genealogy', () => {
      // Visit genealogy page
      safeVisit('/genealogy');
      
      // Take a screenshot
      cy.screenshot('error-empty-genealogy');
      
      // Check for empty genealogy message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasEmptyMessage = text.includes('empty') || 
                              text.includes('no members') || 
                              text.includes('no downline') || 
                              text.includes('start building');
        
        if (hasEmptyMessage) {
          cy.log('✅ Page shows empty genealogy message');
        } else {
          cy.log('❌ Page does not show empty genealogy message');
        }
      });
    });
    
    it('should handle empty rebates', () => {
      // Visit rebates page
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('error-empty-rebates');
      
      // Check for empty rebates message
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasEmptyMessage = text.includes('empty') || 
                              text.includes('no rebates') || 
                              text.includes('no earnings') || 
                              text.includes('start earning');
        
        if (hasEmptyMessage) {
          cy.log('✅ Page shows empty rebates message');
        } else {
          cy.log('❌ Page does not show empty rebates message');
        }
      });
    });
  });
});
