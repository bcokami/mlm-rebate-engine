describe('MLM Application Test', () => {
  it('should test the home page structure', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    cy.log('Accessed home page');
    
    // Take a screenshot
    cy.screenshot('home-page-final');
    
    // Log page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Check for main content
    cy.get('main, #__next, #root, .app').then(($main) => {
      if ($main.length > 0) {
        cy.log('Found main content container');
      } else {
        cy.log('No main content container found');
      }
    });
    
    // Check for headings
    cy.get('h1, h2, h3').then(($headings) => {
      if ($headings.length > 0) {
        cy.log(`Found ${$headings.length} headings`);
        $headings.each((i, el) => {
          cy.log(`Heading ${i+1}: ${Cypress.$(el).text()}`);
        });
      } else {
        cy.log('No headings found');
      }
    });
    
    // Check for images
    cy.get('img').then(($images) => {
      cy.log(`Found ${$images.length} images`);
    });
  });

  it('should test navigation and links', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Find all links
    cy.get('a').then(($links) => {
      cy.log(`Found ${$links.length} links`);
      
      // Log the first 5 links
      $links.slice(0, 5).each((i, el) => {
        const $el = Cypress.$(el);
        const href = $el.attr('href') || 'no-href';
        const text = $el.text().trim() || '[no text]';
        cy.log(`Link ${i+1}: ${text} (${href})`);
      });
    });
    
    // Find all buttons
    cy.get('button').then(($buttons) => {
      cy.log(`Found ${$buttons.length} buttons`);
      
      // Log the first 5 buttons
      $buttons.slice(0, 5).each((i, el) => {
        const text = Cypress.$(el).text().trim() || '[no text]';
        cy.log(`Button ${i+1}: ${text}`);
      });
    });
  });

  it('should test responsive behavior', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Test on desktop
    cy.viewport(1280, 800);
    cy.wait(500); // Wait for resize
    cy.screenshot('responsive-desktop');
    
    // Test on tablet
    cy.viewport(768, 1024);
    cy.wait(500); // Wait for resize
    cy.screenshot('responsive-tablet');
    
    // Test on mobile
    cy.viewport(375, 667);
    cy.wait(500); // Wait for resize
    cy.screenshot('responsive-mobile');
    
    // Check if there's a mobile menu button
    cy.get('button[aria-label*="menu"], button[aria-label*="navigation"], button.hamburger, .mobile-menu-button').then(($menuButton) => {
      if ($menuButton.length > 0) {
        cy.log('Found mobile menu button');
      } else {
        cy.log('No mobile menu button found');
      }
    });
  });

  it('should test performance metrics', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Check performance metrics
    cy.window().then((win) => {
      if (win.performance && win.performance.timing) {
        const timing = win.performance.timing;
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        const domLoadTime = timing.domComplete - timing.domLoading;
        
        cy.log(`Page load time: ${pageLoadTime}ms`);
        cy.log(`DOM load time: ${domLoadTime}ms`);
        
        // Check if page load time is reasonable
        expect(pageLoadTime).to.be.lessThan(10000); // 10 seconds
      } else {
        cy.log('Performance metrics not available');
      }
    });
  });

  it('should test accessibility basics', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Check for alt text on images
    cy.get('img').each(($img) => {
      const alt = $img.attr('alt') || '';
      const src = $img.attr('src') || 'no-src';
      
      if (alt) {
        cy.log(`Image has alt text: "${alt}" (${src})`);
      } else {
        cy.log(`Image missing alt text: ${src}`);
      }
    });
    
    // Check for ARIA attributes
    cy.get('[aria-label], [aria-describedby], [aria-labelledby]').then(($ariaElements) => {
      cy.log(`Found ${$ariaElements.length} elements with ARIA attributes`);
    });
    
    // Check heading hierarchy
    cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
      const headingLevels = {};
      
      $headings.each((i, el) => {
        const tagName = el.tagName.toLowerCase();
        headingLevels[tagName] = (headingLevels[tagName] || 0) + 1;
      });
      
      cy.log('Heading hierarchy:');
      Object.keys(headingLevels).sort().forEach((level) => {
        cy.log(`${level}: ${headingLevels[level]}`);
      });
    });
  });
});
