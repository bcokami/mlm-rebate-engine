describe('Robust MLM Application Test', () => {
  it('should capture the home page', () => {
    // Visit the home page with failOnStatusCode set to false
    cy.visit('/', { failOnStatusCode: false });
    
    // Take a screenshot
    cy.screenshot('home-page-robust');
    
    // Log the URL
    cy.url().then((url) => {
      cy.log(`Current URL: ${url}`);
    });
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
      // No assertion, just logging
    });
    
    // Log the page content
    cy.get('body').then(($body) => {
      // Just log that we found the body
      cy.log('Found page body element');
      
      // Log text content length
      const textContent = $body.text().trim();
      cy.log(`Page contains ${textContent.length} characters of text`);
      
      // Check if page has content
      expect(textContent.length).to.be.greaterThan(0);
    });
  });

  it('should find and log page elements', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Try to find various elements but don't fail if not found
    const elementTypes = [
      'div', 'span', 'p', 'a', 'button', 'img', 'h1', 'h2', 'h3',
      'input', 'form', 'table', 'ul', 'li', 'nav', 'header', 'footer'
    ];
    
    // Check each element type
    elementTypes.forEach((type) => {
      cy.get(type).then(($elements) => {
        cy.log(`Found ${$elements.length} <${type}> elements`);
      });
    });
    
    // Take a screenshot
    cy.screenshot('page-elements');
  });

  it('should test basic interactivity', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Try to find clickable elements
    cy.get('a, button').then(($clickables) => {
      cy.log(`Found ${$clickables.length} potentially clickable elements`);
      
      if ($clickables.length > 0) {
        // Log the first 5 clickable elements
        $clickables.slice(0, 5).each((i, el) => {
          const $el = Cypress.$(el);
          const text = $el.text().trim() || '[no text]';
          const tagName = el.tagName.toLowerCase();
          cy.log(`Clickable ${i+1}: <${tagName}> "${text}"`);
        });
      }
    });
    
    // Try to find form elements
    cy.get('input, select, textarea').then(($formElements) => {
      cy.log(`Found ${$formElements.length} form elements`);
      
      if ($formElements.length > 0) {
        // Log the first 5 form elements
        $formElements.slice(0, 5).each((i, el) => {
          const $el = Cypress.$(el);
          const type = $el.attr('type') || 'no-type';
          const name = $el.attr('name') || 'no-name';
          const tagName = el.tagName.toLowerCase();
          cy.log(`Form element ${i+1}: <${tagName}> type="${type}" name="${name}"`);
        });
      }
    });
  });

  it('should test responsive layouts', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Array of viewport sizes to test
    const viewports = [
      { width: 1280, height: 800, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    // Test each viewport
    viewports.forEach((viewport) => {
      cy.viewport(viewport.width, viewport.height);
      cy.wait(500); // Wait for resize
      
      // Take a screenshot for this viewport
      cy.screenshot(`responsive-${viewport.name}`);
      
      // Log viewport size
      cy.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Check if page content is visible
      cy.get('body').should('be.visible');
    });
  });

  it('should check basic accessibility', () => {
    // Visit the home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Check for images with alt text
    cy.get('img').then(($images) => {
      let withAlt = 0;
      let withoutAlt = 0;
      
      $images.each((i, el) => {
        if (el.hasAttribute('alt')) {
          withAlt++;
        } else {
          withoutAlt++;
        }
      });
      
      cy.log(`Images with alt text: ${withAlt}`);
      cy.log(`Images without alt text: ${withoutAlt}`);
    });
    
    // Check for form labels
    cy.get('input').then(($inputs) => {
      let withLabel = 0;
      let withoutLabel = 0;
      
      $inputs.each((i, el) => {
        const $el = Cypress.$(el);
        const id = $el.attr('id');
        
        if (id && Cypress.$(`label[for="${id}"]`).length > 0) {
          withLabel++;
        } else {
          withoutLabel++;
        }
      });
      
      cy.log(`Inputs with associated labels: ${withLabel}`);
      cy.log(`Inputs without associated labels: ${withoutLabel}`);
    });
    
    // Take a screenshot
    cy.screenshot('accessibility-check');
  });
});
