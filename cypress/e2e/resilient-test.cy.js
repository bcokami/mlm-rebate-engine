describe('Resilient Application Test', () => {
  it('should test the home page', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.log('Accessed home page');
    cy.screenshot('home-page');
    
    // Log page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all visible text to understand page content
    cy.get('body').then(($body) => {
      cy.log(`Page text: ${$body.text().substring(0, 200)}...`);
    });
    
    // Check for navigation elements
    cy.get('nav, header, .navbar, .navigation').then(($nav) => {
      if ($nav.length > 0) {
        cy.log('Found navigation element');
        
        // Log navigation links
        cy.get('nav a, header a, .navbar a, .navigation a').each(($link) => {
          const href = $link.attr('href') || 'no-href';
          const text = $link.text().trim();
          if (text) {
            cy.log(`Navigation link: ${text} (${href})`);
          }
        });
      } else {
        cy.log('No navigation element found');
      }
    });
  });
  
  it('should test available routes', () => {
    // List of routes to test
    const routes = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/products',
      '/genealogy',
      '/rebates'
    ];
    
    // Visit each route and capture what we find
    routes.forEach((route) => {
      cy.visit(route, { failOnStatusCode: false });
      cy.url().then((url) => {
        cy.log(`Visited ${route}, landed at ${url}`);
        
        // Take a screenshot of each page
        cy.screenshot(`route-${route.replace(/\//g, '-')}`);
        
        // Log page structure
        cy.get('h1, h2, h3').each(($heading) => {
          cy.log(`Heading on ${route}: ${$heading.text()}`);
        });
        
        // Check for forms
        cy.get('form').then(($form) => {
          if ($form.length > 0) {
            cy.log(`Found form on ${route}`);
          }
        });
        
        // Check for tables
        cy.get('table').then(($table) => {
          if ($table.length > 0) {
            cy.log(`Found table on ${route}`);
          }
        });
      });
    });
  });
  
  it('should test form interactions where available', () => {
    // Try login form
    cy.visit('/login', { failOnStatusCode: false });
    cy.get('input').then(($inputs) => {
      if ($inputs.length > 0) {
        cy.log(`Found ${$inputs.length} input fields on login page`);
        
        // Try to fill in form fields
        cy.get('input[type="email"], input[type="text"]').first().type('test@example.com', { force: true });
        cy.get('input[type="password"]').first().type('password123', { force: true });
        cy.screenshot('login-form-filled');
      }
    });
    
    // Try registration form
    cy.visit('/register', { failOnStatusCode: false });
    cy.get('input').then(($inputs) => {
      if ($inputs.length > 0) {
        cy.log(`Found ${$inputs.length} input fields on registration page`);
        
        // Try to fill in form fields
        cy.get('input').each(($input, index) => {
          const type = $input.attr('type');
          if (type === 'text' || type === 'email') {
            cy.wrap($input).type(`test-${index}@example.com`, { force: true });
          } else if (type === 'password') {
            cy.wrap($input).type('password123', { force: true });
          }
        });
        cy.screenshot('registration-form-filled');
      }
    });
  });
  
  it('should test interactive elements', () => {
    // Visit home page
    cy.visit('/', { failOnStatusCode: false });
    
    // Try clicking buttons
    cy.get('button').then(($buttons) => {
      if ($buttons.length > 0) {
        cy.log(`Found ${$buttons.length} buttons on home page`);
        // Don't actually click to avoid navigation issues
      }
    });
    
    // Check for product listings
    cy.visit('/products', { failOnStatusCode: false });
    cy.get('.product, [data-testid*="product"], .card').then(($products) => {
      if ($products.length > 0) {
        cy.log(`Found ${$products.length} potential product elements`);
        cy.screenshot('products-page');
      }
    });
    
    // Check for genealogy visualization
    cy.visit('/genealogy', { failOnStatusCode: false });
    cy.get('svg, canvas, [data-testid*="tree"], [data-testid*="genealogy"]').then(($tree) => {
      if ($tree.length > 0) {
        cy.log(`Found ${$tree.length} potential genealogy visualization elements`);
        cy.screenshot('genealogy-visualization');
      }
    });
  });
});
