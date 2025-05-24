# Test Credentials Documentation

This document contains all test user credentials for the MLM Rebate Engine application.

## Test User Accounts

### Admin User
- **Email**: admin@test.com
- **Password**: Test@123
- **Role**: Admin
- **Purpose**: System administrator with full access to all features
- **Usage**: Used in admin-specific tests, user management, system configuration

### Regular User
- **Email**: test@example.com
- **Password**: Password@123
- **Role**: User
- **Purpose**: Basic user for testing standard functionality
- **Usage**: Used in general user flow tests, authentication tests

### Distributor
- **Email**: distributor@example.com
- **Password**: Distributor@123
- **Role**: Distributor
- **Purpose**: Basic distributor level for MLM testing
- **Usage**: Used in MLM hierarchy tests, basic commission calculations

### Silver Member
- **Email**: silver@example.com
- **Password**: Silver@123
- **Role**: Silver
- **Purpose**: Silver rank member for testing rank-specific features
- **Usage**: Used in rank advancement tests, tier-specific functionality

### Gold Member
- **Email**: gold@example.com
- **Password**: Gold@123
- **Role**: Gold
- **Purpose**: Gold rank member for testing higher-tier features
- **Usage**: Used in advanced rank tests, higher commission calculations

### Platinum Member
- **Email**: platinum@example.com
- **Password**: Platinum@123
- **Role**: Platinum
- **Purpose**: Platinum rank member for testing premium features
- **Usage**: Used in premium feature tests, highest tier functionality

## Cypress Commands

The following Cypress commands are available for logging in as different users:

```javascript
cy.loginAsAdmin()        // Logs in as admin user
cy.loginAsTestUser()     // Logs in as regular user
cy.loginAsDistributor()  // Logs in as distributor
cy.loginAsSilver()       // Logs in as silver member
cy.loginAsGold()         // Logs in as gold member
cy.loginAsPlatinum()     // Logs in as platinum member
```

## Configuration

Test users are configured in two places:

1. **Fixture File**: `cypress/fixtures/test-users.json`
2. **Cypress Config**: `cypress.config.js` (environment variables)

The system uses fixtures by default when `useFixtures: true` is set in the Cypress configuration.

## Security Notes

- These are test credentials only and should never be used in production
- Passwords follow a consistent pattern for easy testing
- All test users should be clearly marked in the database
- Test data should be cleaned up regularly

## Usage in Tests

Example usage in test files:

```javascript
describe('User Authentication', () => {
  it('should login as admin', () => {
    cy.loginAsAdmin();
    cy.url().should('include', '/dashboard');
  });

  it('should login as regular user', () => {
    cy.loginAsTestUser();
    cy.url().should('include', '/dashboard');
  });
});
```

## Maintenance

- Review and update credentials quarterly
- Remove unused test accounts
- Ensure all test users have proper roles and permissions
- Verify test data integrity before major releases
