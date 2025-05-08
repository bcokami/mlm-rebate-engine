# MLM System Flow Test

This document outlines the steps to test the complete MLM system flow, including member registration, package purchase, upline earnings, product sharing, and commission tracking.

## Prerequisites

- A running instance of the MLM application
- Access to the database to verify transactions
- At least one starter package product configured in the system
- Admin access to verify rebate calculations

## Test Scenarios

### 1. Member Registration with Upline and Package Purchase

#### 1.1 Create Upline Member (First User)

1. Navigate to `/register`
2. Fill in the registration form with the following details:
   - Name: "Upline User"
   - Email: "upline@example.com"
   - Password: "Password123"
   - Phone: "09123456789"
   - Payment Method: GCash
   - GCash Number: "09123456789"
   - Agree to Terms: Yes
3. Complete the registration process
4. Log in with the newly created account
5. Note the user ID from the profile page or URL (needed for the next step)

#### 1.2 Register New Member with Upline Reference

1. Open a new incognito/private browser window
2. Navigate to `/register`
3. Fill in the registration form with the following details:
   - Name: "Downline User"
   - Email: "downline@example.com"
   - Password: "Password123"
   - Phone: "09876543210"
   - Payment Method: GCash
   - GCash Number: "09876543210"
   - Upline ID: [ID of the Upline User from step 1.1]
   - Agree to Terms: Yes
4. Complete the registration process
5. Log in with the newly created account

#### 1.3 Purchase Starter Package

1. While logged in as "Downline User"
2. Navigate to `/shop`
3. Find a product marked as a starter package
4. Click on the product to view details
5. Click "Buy Now"
6. Complete the purchase process:
   - Select payment method: GCash
   - Confirm the purchase
7. Verify the purchase confirmation page shows success message
8. Navigate to `/purchases` to verify the purchase is listed

#### 1.4 Verify Upline Earnings

1. Log out from "Downline User"
2. Log in as "Upline User" (upline@example.com)
3. Navigate to `/wallet` or `/earnings`
4. Verify that a commission/rebate has been recorded for the downline's package purchase
5. Check the amount matches the expected percentage for direct referrals

### 2. Product Sharing and Earning from Shared Links

#### 2.1 Create and Share Product Link

1. While logged in as "Upline User"
2. Navigate to `/shop`
3. Select any product
4. Click on the "Share" button
5. Copy the generated shareable link
6. Note the product details and commission structure

#### 2.2 Purchase Through Shared Link (Existing Member)

1. Log out from "Upline User"
2. Log in as "Downline User"
3. Open the copied shareable link in the browser
4. Verify the product page shows a referral badge
5. Purchase the product:
   - Click "Buy Now"
   - Complete the purchase with GCash
6. Verify purchase confirmation

#### 2.3 Purchase Through Shared Link (Guest User)

1. Open a new incognito/private browser window
2. Paste the shareable link in the browser
3. Verify the product page shows a referral badge
4. Add the product to cart
5. Proceed to checkout as a guest
6. Complete the purchase with the following details:
   - Name: "Guest User"
   - Email: "guest@example.com"
   - Phone: "09555555555"
   - Address: "123 Test Street"
   - Payment Method: GCash
7. Verify purchase confirmation

#### 2.4 Verify Referral Commissions

1. Log in as "Upline User" (who shared the product)
2. Navigate to `/referrals` or `/earnings`
3. Verify that commissions have been recorded for both:
   - The purchase made by "Downline User"
   - The purchase made by the guest user
4. Check that the commission amounts match the product's referral commission structure

### 3. New Member Registration Through Shared Link

#### 3.1 Share Registration Link

1. While logged in as "Upline User"
2. Navigate to profile or referral section
3. Find and copy the member referral link

#### 3.2 Register New Member Through Referral Link

1. Open a new incognito/private browser window
2. Paste the referral link in the browser
3. Complete the registration form with the following details:
   - Name: "Referred User"
   - Email: "referred@example.com"
   - Password: "Password123"
   - Phone: "09111222333"
   - Payment Method: GCash
   - GCash Number: "09111222333"
   - Agree to Terms: Yes
4. Verify that the upline ID is pre-filled or hidden in the form
5. Complete the registration process
6. Log in with the newly created account

#### 3.3 Purchase Product as New Referred Member

1. While logged in as "Referred User"
2. Navigate to `/shop`
3. Select and purchase any product
4. Complete the checkout process

#### 3.4 Verify Multi-Level Commissions

1. Log in as "Upline User"
2. Navigate to `/earnings` or `/wallet`
3. Verify that a commission has been recorded for the purchase made by "Referred User"
4. Log in as the original "Downline User" (if applicable in your MLM structure)
5. Check if any second-level commissions have been recorded

## Expected Results

- All registrations should complete successfully
- Package purchases should generate appropriate commissions for uplines
- Shared product links should track referrals correctly
- Purchases through shared links should generate commissions
- New member registrations through referral links should establish the correct upline relationship
- Multi-level commissions should be calculated according to the configured percentages

## Troubleshooting

If any test fails, check the following:

1. Server logs for errors
2. Database records for the relevant transactions
3. Commission calculation settings
4. User relationships in the database
5. Payment processing status

## Notes

- Actual commission amounts will vary based on your system configuration
- Some features may require admin verification in the admin panel
- The test assumes a binary or unilevel MLM structure with at least 2 levels of commissions
