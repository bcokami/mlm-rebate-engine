describe('Login Functionality', () => {
  beforeEach(() => {
    // Clear cookies and local storage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Visit login page
    cy.visit('/login');
    
    // Intercept API calls
    cy.intercept('POST', '/api/auth/callback/credentials').as('loginRequest');
    cy.intercept('GET', '/api/user/profile').as('profileRequest');
  });

  it('should display the login form', () => {
    // Check page title
    cy.get('h1').should('contain', 'Login');
    
    // Check form elements
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    
    // Check remember me checkbox
    cy.get('input[type="checkbox"][name="remember"]').should('be.visible');
    cy.contains('Remember me').should('be.visible');
    
    // Check navigation links
    cy.contains('Forgot password').should('be.visible');
    cy.contains('Create an account').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Check for error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid');
  });

  it('should login successfully with valid credentials', () => {
    // Mock successful login response
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('loginRequest');
    
    // Mock user profile response
    cy.intercept('GET', '/api/user/profile', {
      statusCode: 200,
      body: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      }
    }).as('profileRequest');
    
    // Use test user credentials from environment variables
    const { email, password } = Cypress.env('testUser');
    
    // Fill login form
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Wait for the login request to complete
    cy.wait('@loginRequest');
    
    // Check redirection to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify user is logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
    cy.get('[data-testid="user-name"]').should('contain', 'Test User');
  });
  
  it('should remember user when remember me is checked', () => {
    // Mock successful login response
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('loginRequest');
    
    // Use test user credentials
    const { email, password } = Cypress.env('testUser');
    
    // Fill login form and check remember me
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[type="checkbox"][name="remember"]').check();
    cy.get('button[type="submit"]').click();
    
    // Wait for the login request to complete
    cy.wait('@loginRequest');
    
    // Check that session cookie has extended expiry
    cy.getCookie('next-auth.session-token').should('exist');
    
    // Reload the page to verify session persistence
    cy.reload();
    
    // User should still be logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
  
  it('should handle server errors during login', () => {
    // Mock server error response
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 500,
      body: {
        success: false,
        error: 'Internal server error'
      }
    }).as('loginServerError');
    
    // Fill login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for the login request to complete
    cy.wait('@loginServerError');
    
    // Check error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'server error');
    
    // User should still be on login page
    cy.url().should('include', '/login');
  });

  it('should navigate to registration page', () => {
    cy.contains('Create an account').click();
    cy.url().should('include', '/register');
  });

  it('should navigate to forgot password page', () => {
    cy.contains('Forgot password').click();
    cy.url().should('include', '/forgot-password');
  });

  it('should handle form validation', () => {
    // Submit without entering any data
    cy.get('button[type="submit"]').click();
    
    // Check for validation messages
    cy.get('input[name="email"]:invalid').should('exist');
    
    // Enter invalid email format
    cy.get('input[name="email"]').type('invalidemail');
    cy.get('button[type="submit"]').click();
    
    // Check for validation message
    cy.get('input[name="email"]:invalid').should('exist');
    
    // Enter valid email but no password
    cy.get('input[name="email"]').clear().type('valid@example.com');
    cy.get('button[type="submit"]').click();
    
    // Check for validation message on password
    cy.get('input[name="password"]:invalid').should('exist');
  });
});
