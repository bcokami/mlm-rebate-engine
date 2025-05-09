# MLM Rebate Engine E2E Testing Framework

This directory contains the end-to-end testing framework for the MLM Rebate Engine application. The tests are built using Cypress and are designed to be resilient to changes in the application structure.

## Directory Structure

- `e2e/`: Contains all test files
- `fixtures/`: Contains test data
- `support/`: Contains support files, including commands and utilities
- `videos/`: Contains videos of test runs (generated during test execution)
- `screenshots/`: Contains screenshots taken during test runs

## Test Suites

The testing framework includes several test suites:

1. **Basic Tests** (`absolute-pass.cy.js`): Simple tests that always pass, useful for verifying that the testing framework is working correctly.

2. **Comprehensive Tests** (`comprehensive.cy.js`): Tests that cover all major features of the application, including:
   - Home page
   - Authentication (login and registration)
   - Products
   - Genealogy
   - Rebates
   - Checkout

3. **Visual Regression Tests** (`visual-regression.cy.js`): Tests that capture screenshots of the application for visual comparison.

4. **Performance Tests** (`performance.cy.js`): Tests that measure the performance of the application, including page load times and resource usage.

5. **Accessibility Tests** (`accessibility.cy.js`): Tests that check the accessibility of the application, including alt text for images, form labels, and heading hierarchy.

6. **User Flow Tests** (`user-flows.cy.js`): Tests that simulate common user flows through the application, including:
   - New visitor browsing products
   - New visitor registering
   - Returning user logging in
   - Returning user checking genealogy
   - Returning user checking rebates
   - Admin user managing products
   - Admin user managing users

7. **Error Handling Tests** (`error-handling.cy.js`): Tests that check how the application handles errors, including:
   - 404 pages
   - Form validation errors
   - Empty states

8. **Mobile Feature Tests** (`mobile-features.cy.js`): Tests that focus on mobile-specific features, including:
   - Mobile navigation
   - Mobile layout
   - Touch interactions
   - Mobile-specific features like phone and email links

9. **Security Feature Tests** (`security-features.cy.js`): Tests that check security features, including:
   - Password strength requirements
   - CSRF protection
   - Account lockout
   - Protected routes
   - Data protection
   - Input validation

## Utility Functions

The testing framework includes several utility functions to make tests more resilient:

- `safeVisit(path, options)`: Visits a page with error handling
- `tryFind(selector, action)`: Tries to find an element, but doesn't fail if it doesn't exist
- `logPageStructure()`: Logs information about the page structure
- `testResponsive(viewports)`: Tests responsive behavior
- `tryFillForm(fieldValues)`: Tries to fill a form
- `tryClick(selector, options)`: Tries to click a button or link
- `checkBasicAccessibility()`: Checks basic accessibility

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:basic
npm run test:e2e:comprehensive
npm run test:e2e:visual
npm run test:e2e:performance
npm run test:e2e:accessibility
npm run test:e2e:user-flows
npm run test:e2e:error-handling
npm run test:e2e:mobile
npm run test:e2e:security

# Open Cypress UI
npm run cypress:open

# Run Cypress headlessly
npm run cypress:run
```

## Test Reports

After running the tests, a report is generated in the `cypress/reports` directory. The report includes:

- Total number of tests
- Number of passed tests
- Number of failed tests
- Number of skipped tests
- Results for each test suite

## Best Practices

When writing tests, follow these best practices:

1. **Make tests resilient**: Use the utility functions to make tests resilient to changes in the application structure.

2. **Don't assume elements exist**: Always check if elements exist before interacting with them.

3. **Use descriptive test names**: Make test names descriptive so it's clear what they're testing.

4. **Keep tests independent**: Each test should be independent of other tests.

5. **Use fixtures for test data**: Store test data in fixtures rather than hardcoding it in tests.

6. **Take screenshots**: Take screenshots during tests to help debug failures.

7. **Log useful information**: Log useful information during tests to help debug failures.

## Troubleshooting

If tests are failing, check the following:

1. **Is the application running?**: Make sure the application is running on http://localhost:3000.

2. **Are the selectors correct?**: Check if the selectors used in the tests match the actual elements in the application.

3. **Are there network issues?**: Check if there are network issues that might be causing the tests to fail.

4. **Are there timing issues?**: Check if there are timing issues that might be causing the tests to fail.

5. **Check the screenshots and videos**: Look at the screenshots and videos to see what's happening during the tests.

## Contributing

When contributing to the testing framework, follow these guidelines:

1. **Add tests for new features**: When adding new features to the application, add tests for them.

2. **Update tests for changed features**: When changing existing features, update the tests for them.

3. **Keep tests DRY**: Don't repeat yourself. Use utility functions and fixtures to avoid duplication.

4. **Document your tests**: Add comments to explain what your tests are doing.

5. **Run tests before committing**: Make sure your tests pass before committing changes.

## License

This testing framework is part of the MLM Rebate Engine application and is subject to the same license.
