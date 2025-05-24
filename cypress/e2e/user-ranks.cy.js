import { safeVisit } from '../support/test-utils';

describe('User Rank Tests', () => {
  context('Distributor Experience', () => {
    beforeEach(() => {
      // Login as distributor before each test
      cy.loginAsDistributor();
    });
    
    it('should check distributor dashboard', () => {
      // Visit dashboard
      safeVisit('/dashboard');
      
      // Take a screenshot
      cy.screenshot('rank-distributor-dashboard');
      
      // Check for distributor-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasDistributorElements = text.includes('distributor') || 
                                     text.includes('rank') || 
                                     text.includes('downline') ||
                                     text.includes('genealogy');
        
        if (hasDistributorElements) {
          cy.log('✅ Distributor-specific elements found');
        } else {
          cy.log('❌ No distributor-specific elements found');
        }
      });
    });
    
    it('should check distributor rebates', () => {
      // Visit rebates page
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('rank-distributor-rebates');
      
      // Check for rebate information
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasRebateInfo = text.includes('rebate') || 
                            text.includes('commission') || 
                            text.includes('earnings') ||
                            text.includes('bonus');
        
        if (hasRebateInfo) {
          cy.log('✅ Rebate information found');
        } else {
          cy.log('❌ No rebate information found');
        }
      });
    });
  });
  
  context('Silver Member Experience', () => {
    beforeEach(() => {
      // Login as silver member before each test
      cy.loginAsSilver();
    });
    
    it('should check silver member dashboard', () => {
      // Visit dashboard
      safeVisit('/dashboard');
      
      // Take a screenshot
      cy.screenshot('rank-silver-dashboard');
      
      // Check for silver-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasSilverElements = text.includes('silver') || 
                                text.includes('rank') || 
                                text.includes('benefits') ||
                                text.includes('bonus');
        
        if (hasSilverElements) {
          cy.log('✅ Silver-specific elements found');
        } else {
          cy.log('❌ No silver-specific elements found');
        }
      });
    });
    
    it('should check silver member rebates', () => {
      // Visit rebates page
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('rank-silver-rebates');
      
      // Check for silver-specific rebate information
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasSilverRebateInfo = text.includes('silver') || 
                                  text.includes('bonus') || 
                                  text.includes('additional') ||
                                  text.includes('special');
        
        if (hasSilverRebateInfo) {
          cy.log('✅ Silver-specific rebate information found');
        } else {
          cy.log('❌ No silver-specific rebate information found');
        }
      });
    });
  });
  
  context('Gold Member Experience', () => {
    beforeEach(() => {
      // Login as gold member before each test
      cy.loginAsGold();
    });
    
    it('should check gold member dashboard', () => {
      // Visit dashboard
      safeVisit('/dashboard');
      
      // Take a screenshot
      cy.screenshot('rank-gold-dashboard');
      
      // Check for gold-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasGoldElements = text.includes('gold') || 
                              text.includes('rank') || 
                              text.includes('benefits') ||
                              text.includes('bonus');
        
        if (hasGoldElements) {
          cy.log('✅ Gold-specific elements found');
        } else {
          cy.log('❌ No gold-specific elements found');
        }
      });
    });
    
    it('should check gold member rebates', () => {
      // Visit rebates page
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('rank-gold-rebates');
      
      // Check for gold-specific rebate information
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasGoldRebateInfo = text.includes('gold') || 
                                text.includes('bonus') || 
                                text.includes('additional') ||
                                text.includes('special');
        
        if (hasGoldRebateInfo) {
          cy.log('✅ Gold-specific rebate information found');
        } else {
          cy.log('❌ No gold-specific rebate information found');
        }
      });
    });
  });
  
  context('Platinum Member Experience', () => {
    beforeEach(() => {
      // Login as platinum member before each test
      cy.loginAsPlatinum();
    });
    
    it('should check platinum member dashboard', () => {
      // Visit dashboard
      safeVisit('/dashboard');
      
      // Take a screenshot
      cy.screenshot('rank-platinum-dashboard');
      
      // Check for platinum-specific elements
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasPlatinumElements = text.includes('platinum') || 
                                  text.includes('rank') || 
                                  text.includes('benefits') ||
                                  text.includes('bonus');
        
        if (hasPlatinumElements) {
          cy.log('✅ Platinum-specific elements found');
        } else {
          cy.log('❌ No platinum-specific elements found');
        }
      });
    });
    
    it('should check platinum member rebates', () => {
      // Visit rebates page
      safeVisit('/rebates');
      
      // Take a screenshot
      cy.screenshot('rank-platinum-rebates');
      
      // Check for platinum-specific rebate information
      cy.get('body').then($body => {
        const text = $body.text().toLowerCase();
        const hasPlatinumRebateInfo = text.includes('platinum') || 
                                    text.includes('bonus') || 
                                    text.includes('additional') ||
                                    text.includes('special');
        
        if (hasPlatinumRebateInfo) {
          cy.log('✅ Platinum-specific rebate information found');
        } else {
          cy.log('❌ No platinum-specific rebate information found');
        }
      });
    });
  });
  
  context('Rank Comparison', () => {
    it('should compare dashboard elements across ranks', () => {
      // Array of ranks to test
      const ranks = [
        { name: 'distributor', loginCommand: 'loginAsDistributor' },
        { name: 'silver', loginCommand: 'loginAsSilver' },
        { name: 'gold', loginCommand: 'loginAsGold' },
        { name: 'platinum', loginCommand: 'loginAsPlatinum' }
      ];
      
      // Visit dashboard with each rank and collect information
      ranks.forEach(rank => {
        // Login as the current rank
        cy[rank.loginCommand]();
        
        // Visit dashboard
        safeVisit('/dashboard');
        
        // Take a screenshot
        cy.screenshot(`rank-comparison-${rank.name}`);
        
        // Log rank-specific information
        cy.log(`Checking dashboard for ${rank.name} rank`);
      });
    });
  });
});
