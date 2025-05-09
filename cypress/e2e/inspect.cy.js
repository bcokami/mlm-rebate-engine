describe('Inspect Application Structure', () => {
  it('should inspect the home page', () => {
    cy.visit('/');
    cy.log('Inspecting home page structure');
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all headings
    cy.get('h1, h2, h3').each(($el) => {
      cy.log(`Heading: ${$el.text()}`);
    });
    
    // Log all navigation links
    cy.get('nav a, .nav a, .navbar a, .navigation a, header a').each(($link) => {
      cy.log(`Navigation link: ${$link.text()} (href: ${$link.attr('href')})`);
    });
    
    // Take a screenshot
    cy.screenshot('home-page-structure');
  });
  
  it('should inspect the login page', () => {
    cy.visit('/login');
    cy.log('Inspecting login page structure');
    
    // Log the page title
    cy.title().then((title) => {
      cy.log(`Page title: ${title}`);
    });
    
    // Log all form elements
    cy.get('form').then(($form) => {
      if ($form.length > 0) {
        cy.log('Form found');
        
        // Log all inputs
        cy.get('form input').each(($input) => {
          cy.log(`Input: type=${$input.attr('type')}, name=${$input.attr('name')}, id=${$input.attr('id')}`);
        });
        
        // Log all buttons
        cy.get('form button').each(($button) => {
          cy.log(`Button: type=${$button.attr('type')}, text=${$button.text()}`);
        });
      } else {
        cy.log('No form found');
      }
    });
    
    // Take a screenshot
    cy.screenshot('login-page-structure');
  });
  
  it('should inspect available routes', () => {
    // List of common routes to check
    const routes = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/products',
      '/cart',
      '/checkout',
      '/genealogy',
      '/rebates',
      '/profile'
    ];
    
    // Visit each route and log if it exists
    routes.forEach((route) => {
      cy.visit(route, { failOnStatusCode: false }).then((resp) => {
        cy.url().then((url) => {
          if (url.includes(route)) {
            cy.log(`Route ${route} exists`);
            cy.screenshot(`route-${route.replace(/\//g, '-')}`);
          } else {
            cy.log(`Route ${route} redirected to ${url}`);
          }
        });
      });
    });
  });
});
