# Test Credentials for MLM System

This file contains login credentials for test users with different roles in the MLM system.
All users have the same password: `Test@123`

> **Important Note**: If you encounter login issues, make sure you're using the correct password. The system uses bcryptjs for password hashing.

## Admin Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| Admin User | admin@test.com | Admin | Test@123 |
| Super Admin | superadmin@test.com | Admin | Test@123 |
| Test Admin | testadmin@example.com | Admin | Test@123 |
| Simple User | simple@test.com | Member | Test@123 |

> **Note**: If you encounter login issues with the users above, use the Simple User account which is created with a special script that ensures correct password hashing.

## Manager Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| Product Manager | product.manager@test.com | Manager | Test@123 |
| User Manager | user.manager@test.com | Manager | Test@123 |

## Distributor Users

| Name | Email | Rank | Upline | Password |
|------|-------|------|--------|----------|
| Diamond Distributor | diamond@test.com | diamond | None | Test@123 |
| Platinum Distributor | platinum@test.com | platinum | None | Test@123 |
| Gold Distributor 1 | gold1@test.com | gold | diamond@test.com | Test@123 |
| Gold Distributor 2 | gold2@test.com | gold | platinum@test.com | Test@123 |
| Silver Distributor 1 | silver1@test.com | silver | gold1@test.com | Test@123 |
| Silver Distributor 2 | silver2@test.com | silver | gold1@test.com | Test@123 |
| Silver Distributor 3 | silver3@test.com | silver | gold2@test.com | Test@123 |
| Bronze Distributor 1 | bronze1@test.com | bronze | silver1@test.com | Test@123 |
| Bronze Distributor 2 | bronze2@test.com | bronze | silver2@test.com | Test@123 |
| Bronze Distributor 3 | bronze3@test.com | bronze | silver3@test.com | Test@123 |
| New Distributor 1 | new1@test.com | new | bronze1@test.com | Test@123 |
| New Distributor 2 | new2@test.com | new | bronze2@test.com | Test@123 |
| New Distributor 3 | new3@test.com | new | bronze3@test.com | Test@123 |

## Customer Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| Regular Customer 1 | customer1@test.com | Customer | Test@123 |
| Regular Customer 2 | customer2@test.com | Customer | Test@123 |

## MLM Structure

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

## Testing Notes

- Use these accounts to test different aspects of the MLM system
- The structure allows testing of up to 5 levels of the MLM hierarchy
- All distributor accounts have wallets initialized with zero balance
- For cleanup, use the script: `npm run cleanup-dummy-users`

## Test Scenarios

### 1. Member Registration and Package Purchase

**Test Steps:**
1. Log in as `new1@test.com` (New Distributor 1)
2. Purchase a starter package
3. Log in as `bronze1@test.com` (Bronze Distributor 1, upline)
4. Verify commission received

### 2. Product Sharing and Referral

**Test Steps:**
1. Log in as `silver1@test.com` (Silver Distributor 1)
2. Create and share a product link
3. Log in as `customer1@test.com` (Customer)
4. Purchase through the shared link
5. Log in as `silver1@test.com` again
6. Verify referral commission

### 3. Multi-Level Commission Testing

**Test Steps:**
1. Log in as `new1@test.com` (New Distributor 1)
2. Make a purchase
3. Check commissions for:
   - `bronze1@test.com` (Level 1 upline)
   - `silver1@test.com` (Level 2 upline)
   - `gold1@test.com` (Level 3 upline)
   - `diamond@test.com` (Level 4 upline)

### 4. Admin Operations

**Test Steps:**
1. Log in as `admin@test.com`
2. Manage products, users, and commissions
3. View system reports and analytics

### 5. Manager Operations

**Test Steps:**
1. Log in as `product.manager@test.com`
2. Manage product inventory and pricing
3. Log in as `user.manager@test.com`
4. Manage user accounts and support requests
