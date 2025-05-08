# MLM System Testing Guide

This guide provides instructions for testing the MLM system functionality, including member registration, package purchase, upline earnings, product sharing, and commission tracking.

## Prerequisites

Before running the tests, ensure you have:

1. A running instance of the MLM application (`npm run dev`)
2. A clean database or a database with test data
3. Node.js and npm installed

## Test Scenarios

The test suite covers the following key scenarios:

1. **Member Registration with Upline and Package Purchase**
   - Creating upline and downline relationships
   - Purchasing starter packages
   - Verifying upline earnings

2. **Product Sharing and Earning from Shared Links**
   - Creating and sharing product links
   - Purchasing through shared links (as members and guests)
   - Verifying referral commissions

3. **New Member Registration Through Shared Links**
   - Sharing registration links
   - Registering new members through referral links
   - Verifying multi-level commissions

## Running the Tests

### Automated Test Runner

We provide a script that guides you through the testing process:

```bash
# Generate test data
npm run generate-test-data

# Run the guided test
npm run test:mlm-flow
```

The test runner will:
1. Generate necessary test data
2. Guide you through each test step
3. Provide verification points
4. Display test credentials

### Manual Testing

For a more detailed manual test, follow the steps in the [MLM Flow Test](./mlm-flow-test.md) document.

## Test Data

The test data generator creates:

- Test users with upline relationships
- Test products including starter packages
- Rebate configurations
- Shareable links

### Test User Credentials

After running the test data generator, you can use these credentials:

- **Upline User**:
  - Email: test.upline@example.com
  - Password: Password123

- **Downline User**:
  - Email: test.downline@example.com
  - Password: Password123

## Verification Points

When testing, verify the following key points:

1. **Registration**:
   - Users can register with upline references
   - Upline-downline relationships are correctly established

2. **Package Purchase**:
   - Members can purchase starter packages
   - Uplines receive appropriate commissions

3. **Product Sharing**:
   - Members can create shareable product links
   - Purchases through shared links are tracked
   - Referral commissions are correctly calculated

4. **Multi-level Commissions**:
   - Commissions flow through multiple levels of the network
   - Commission percentages match the configured values

## Troubleshooting

If you encounter issues during testing:

1. **Database Issues**:
   - Check if the test data was generated correctly
   - Verify database connections and migrations

2. **API Errors**:
   - Check the server logs for error messages
   - Verify API endpoints are functioning correctly

3. **Commission Calculation**:
   - Verify rebate configurations are set up correctly
   - Check the commission calculation logic

## Cleaning Up Test Data

After testing, you can clean up the test data:

```bash
npm run cleanup-test-users
```

This will remove all test users and related data from the database.

## Additional Resources

- [MLM Flow Test](./mlm-flow-test.md) - Detailed test steps
- [API Documentation](../docs/api.md) - API endpoints reference
- [Database Schema](../docs/schema.md) - Database structure
