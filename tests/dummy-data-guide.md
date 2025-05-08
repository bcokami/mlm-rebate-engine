# MLM System Dummy Data Guide

This guide explains how to use the dummy test data for comprehensive testing of the MLM system.

## Overview

The dummy data provides a complete MLM structure with:

- Admin and manager users
- A 5-level distributor hierarchy
- Regular customers
- Pre-configured relationships between users

## Getting Started

### 1. Generate Dummy Data

You have two options for creating test users:

#### Option 1: Generate All Test Users

Run the following command to create all test users:

```bash
npm run generate-dummy-users
```

This will:
- Create all users with the password `Test@123`
- Set up the MLM hierarchy
- Initialize wallets for distributors
- Generate a credentials file at `tests/test-credentials.md`

#### Option 2: Create a Simple Test User (Recommended for Login Issues)

If you're experiencing login issues with the dummy users, use this command to create a reliable test user account:

```bash
npm run create-simple-user
```

This will:
- Create a simple test user with email `simple@test.com` and password `Test@123`
- Use the correct password hashing method
- Create the necessary rank if it doesn't exist
- Handle all database constraints properly

This is the most reliable way to create a test user that will work with the login system.

### 2. Access Test Credentials

After generating the data, you can find all login credentials in:

```
tests/test-credentials.md
```

This file contains:
- Usernames and passwords for all test users
- The MLM hierarchy structure
- Test scenarios for different features

### 3. Testing the MLM System

#### User Roles

The dummy data includes users with the following roles:

- **Admin**: Full system access
- **Manager**: Product and user management
- **Distributor**: MLM participants at different ranks
- **Customer**: Regular buyers without distribution rights

#### MLM Hierarchy

The test data creates a 5-level hierarchy:

```
Diamond Distributor
├── Gold Distributor 1
│   ├── Silver Distributor 1
│   │   └── Bronze Distributor 1
│   │       └── New Distributor 1
│   └── Silver Distributor 2
│       └── Bronze Distributor 2
│           └── New Distributor 2
└── Platinum Distributor
    └── Gold Distributor 2
        └── Silver Distributor 3
            └── Bronze Distributor 3
                └── New Distributor 3
```

This structure allows testing of:
- Direct referral commissions
- Multi-level commissions
- Rank advancement requirements
- Group volume calculations

#### Distributor Ranks

The system includes distributors at various ranks:

1. **New Distributor**: Entry-level rank
2. **Bronze**: First advancement rank
3. **Silver**: Mid-level rank
4. **Gold**: High-level rank
5. **Platinum**: Executive rank
6. **Diamond**: Top rank

Each rank has different commission rates and benefits for testing.

### 4. Test Scenarios

#### Member Registration and Package Purchase

**Test Steps:**
1. Log in as a new distributor (e.g., `new1@test.com`)
2. Purchase a starter package
3. Log in as their upline (e.g., `bronze1@test.com`)
4. Verify commission received

#### Product Sharing and Referral

**Test Steps:**
1. Log in as any distributor
2. Create and share a product link
3. Log in as another user or customer
4. Purchase through the shared link
5. Verify referral commission

#### Multi-Level Commission Testing

**Test Steps:**
1. Log in as a lower-level distributor
2. Make a purchase
3. Check commissions for all upline levels

#### Admin Operations

**Test Steps:**
1. Log in as `admin@test.com`
2. Test administrative functions
3. Generate reports and analytics

### 5. Cleaning Up Test Data

When you're done testing, remove all dummy data with:

```bash
npm run cleanup-dummy-users
```

This will safely remove all test users and related data without affecting real data.

## Advanced Testing

### Testing Rank Advancement

1. Log in as a distributor
2. Recruit new downlines (using existing test accounts)
3. Generate sales volume
4. Verify rank advancement criteria

### Testing Group Volume Bonuses

1. Log in as a higher-rank distributor
2. Have downlines make purchases
3. Verify group volume calculations
4. Check bonus payments

### Testing Binary Structure

If your MLM uses a binary structure:

1. Log in as a distributor with multiple downlines
2. Balance volume between left and right legs
3. Verify binary commissions

## Troubleshooting

### Common Issues

1. **Login Problems**:
   - All test users have the password `Test@123`
   - Verify the email is entered correctly
   - If you encounter "Invalid email or password" errors, use the verification script:
     ```bash
     npm run verify-test-user
     ```
   - This script will check if the password hash is correct and offer to fix it if needed

2. **Missing Commissions**:
   - Check commission rules configuration
   - Verify the upline relationship is correct

3. **Data Cleanup Issues**:
   - If cleanup fails, check for database constraints
   - Try running the cleanup script again

4. **Password Hashing Issues**:
   - The system uses bcryptjs for password hashing
   - If you're having trouble logging in with test users, try these solutions:

     a) Use the verify-test-user script:
     ```bash
     npm run verify-test-user
     ```
     Enter the email and password when prompted. The script will verify if the password hash is correct and offer to fix it.

     b) Create a test admin user with guaranteed correct password hashing:
     ```bash
     npm run create-test-admin
     ```
     This creates a test admin user with email `testadmin@example.com` and password `Test@123`.

     c) If you see a console error like "Invalid email or password" in the browser, check the browser console for more details about the error.

### Getting Help

If you encounter issues with the test data:

1. Check the console output for error messages
2. Verify database connections
3. Ensure all required services are running

## Conclusion

This dummy data provides a comprehensive environment for testing all aspects of the MLM system. Use the provided test scenarios to verify functionality, and create your own scenarios to test specific features.

Remember to clean up the test data when you're done to keep your development environment clean.
