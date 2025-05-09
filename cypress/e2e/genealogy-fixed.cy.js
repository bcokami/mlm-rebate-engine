describe('Genealogy Functionality', () => {
  beforeEach(() => {
    // Visit genealogy page with failOnStatusCode set to false
    cy.visit('/genealogy', { failOnStatusCode: false });
  });

  it('should access the genealogy page', () => {
    // Take a screenshot of the genealogy page
    cy.screenshot('genealogy-page-access');
    
    // Log the current URL
    cy.url().then((url) => {
      cy.log(`Current URL: ${url}`);
    });
    
    // Check if we're on the genealogy page
    cy.url().then((url) => {
      if (url.includes('/genealogy')) {
        cy.log('Successfully accessed genealogy page');
      } else {
        cy.log(`Redirected to: ${url}`);
      }
    });
  });

  it('should identify page structure and elements', () => {
    // Log all headings
    cy.get('h1, h2, h3').each(($heading) => {
      cy.log(`Heading: ${$heading.text()}`);
    });
    
    // Look for SVG elements (often used in tree visualizations)
    cy.get('svg').then(($svg) => {
      cy.log(`Found ${$svg.length} SVG elements`);
    });
    
    // Look for canvas elements (also used in visualizations)
    cy.get('canvas').then(($canvas) => {
      cy.log(`Found ${$canvas.length} canvas elements`);
    });
    
    // Look for div elements that might be part of a tree
    cy.get('div[class*="tree"], div[class*="node"], div[id*="tree"], div[id*="node"]').then(($tree) => {
      cy.log(`Found ${$tree.length} potential tree elements`);
    });
    
    cy.screenshot('genealogy-page-elements');
  });

  it('should look for interactive elements', () => {
    // Look for buttons
    cy.get('button').each(($button, index) => {
      cy.log(`Button ${index + 1}: ${$button.text()}`);
    });
    
    // Look for filter controls
    cy.get('select, input[type="radio"], input[type="checkbox"]').each(($control, index) => {
      const type = $control.prop('tagName').toLowerCase();
      const name = $control.attr('name') || 'unnamed';
      cy.log(`Filter control ${index + 1}: ${type}, name=${name}`);
    });
    
    // Look for search inputs
    cy.get('input[type="search"], input[type="text"]').each(($input, index) => {
      const placeholder = $input.attr('placeholder') || '';
      cy.log(`Search input ${index + 1}: placeholder="${placeholder}"`);
    });
    
    // Look for pagination controls
    cy.get('nav[aria-label*="pagination"], div[class*="pagination"], ul[class*="pagination"]').then(($pagination) => {
      cy.log(`Found ${$pagination.length} potential pagination elements`);
    });
    
    cy.screenshot('genealogy-interactive-elements');
  });

  it('should attempt to interact with tree elements', () => {
    // Try to find and click on tree nodes or expand/collapse controls
    cy.get('div[class*="node"], div[class*="tree"] div, svg g, [aria-expanded]').then(($nodes) => {
      if ($nodes.length > 0) {
        cy.log(`Found ${$nodes.length} potential tree nodes`);
        
        // Try to click the first node (but don't fail if it doesn't work)
        try {
          cy.wrap($nodes.eq(0)).click({ force: true });
          cy.log('Clicked on a tree node');
          cy.screenshot('after-node-click');
        } catch (e) {
          cy.log('Could not click on tree node');
        }
      } else {
        cy.log('No tree nodes found');
      }
    });
    
    // Try to find and use zoom controls
    cy.get('button:contains("Zoom"), button[aria-label*="zoom"], svg[class*="zoom"]').then(($zoom) => {
      if ($zoom.length > 0) {
        cy.log(`Found ${$zoom.length} potential zoom controls`);
      } else {
        cy.log('No zoom controls found');
      }
    });
  });
});
