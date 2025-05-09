describe('Genealogy Page', () => {
  beforeEach(() => {
    cy.visit('/genealogy');
  });

  it('should display the genealogy page', () => {
    // Take a screenshot of the genealogy page
    cy.screenshot('genealogy-page');
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all h1 elements
    cy.get('h1').each(($el) => {
      cy.log(`H1 text: ${$el.text()}`);
    });
    
    // Log all SVG elements (which might be part of the genealogy tree)
    cy.get('svg').then(($svgs) => {
      cy.log(`Found ${$svgs.length} SVG elements`);
    });
  });

  it('should interact with genealogy elements', () => {
    // Find and log all buttons
    cy.get('button').each(($button, index) => {
      cy.log(`Button ${index}: ${$button.text()}`);
    });
    
    // Find and log all interactive elements
    cy.get('[role="button"], [data-testid*="node"], [data-testid*="tree"]').each(($el, index) => {
      cy.log(`Interactive element ${index}: ${$el.attr('data-testid') || 'unnamed'}`);
    });
    
    // Try to find and click on tree nodes
    cy.get('[data-testid*="node"], [data-testid*="tree"], .node, .tree-node').then(($nodes) => {
      if ($nodes.length > 0) {
        cy.log(`Found ${$nodes.length} potential tree nodes`);
        // Click the first node
        cy.wrap($nodes.eq(0)).click({force: true});
        cy.screenshot('after-node-click');
      } else {
        cy.log('No tree nodes found');
      }
    });
  });

  it('should check for filters and controls', () => {
    // Look for filter controls
    cy.get('select, [data-testid*="filter"], [role="combobox"]').then(($filters) => {
      cy.log(`Found ${$filters.length} potential filter controls`);
      
      if ($filters.length > 0) {
        // Interact with the first filter
        cy.wrap($filters.eq(0)).select(1).then(() => {
          cy.screenshot('after-filter-change');
        });
      }
    });
    
    // Look for search functionality
    cy.get('input[type="search"], input[placeholder*="search"], [data-testid*="search"]').then(($search) => {
      if ($search.length > 0) {
        cy.log('Found search input');
        cy.wrap($search.eq(0)).type('test search').then(() => {
          cy.screenshot('after-search-input');
        });
      } else {
        cy.log('No search input found');
      }
    });
  });
});
