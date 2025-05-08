/**
 * MLM Flow Test Runner
 * 
 * This script helps automate and guide through the MLM flow test process.
 * It will:
 * 1. Generate necessary test data
 * 2. Guide the user through the test steps
 * 3. Provide verification points
 * 
 * Usage: npm run test:mlm-flow
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Helper function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to print section headers
function printHeader(text) {
  console.log('\n' + colors.bright + colors.fg.blue + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.fg.blue + ' ' + text + colors.reset);
  console.log(colors.bright + colors.fg.blue + '='.repeat(80) + colors.reset + '\n');
}

// Helper function to print step instructions
function printStep(number, text) {
  console.log(colors.bright + colors.fg.yellow + `Step ${number}: ` + colors.reset + text);
}

// Helper function to print verification points
function printVerification(text) {
  console.log(colors.bright + colors.fg.green + '✓ Verify: ' + colors.reset + text);
}

// Helper function to print notes
function printNote(text) {
  console.log(colors.fg.cyan + 'Note: ' + colors.reset + text);
}

// Helper function to print errors
function printError(text) {
  console.log(colors.fg.red + 'Error: ' + colors.reset + text);
}

// Main function to run the test
async function runTest() {
  try {
    printHeader('MLM FLOW TEST');
    console.log('This script will guide you through testing the complete MLM flow.\n');
    
    // Check if the application is running
    printNote('Before proceeding, make sure your MLM application is running (npm run dev).');
    const appRunning = await prompt('Is the application running? (y/n): ');
    
    if (appRunning.toLowerCase() !== 'y') {
      printNote('Please start the application with "npm run dev" and run this script again.');
      process.exit(0);
    }
    
    // Generate test data
    printHeader('GENERATING TEST DATA');
    console.log('Generating necessary test data for the MLM flow test...');
    
    try {
      execSync('npm run generate-test-data', { stdio: 'inherit' });
      console.log(colors.fg.green + 'Test data generated successfully!' + colors.reset);
    } catch (error) {
      printError('Failed to generate test data. Please check the error and try again.');
      process.exit(1);
    }
    
    // Get test user credentials
    const uplineUser = await prisma.user.findUnique({
      where: { email: 'test.upline@example.com' },
      select: { id: true, name: true, email: true }
    });
    
    const downlineUser = await prisma.user.findUnique({
      where: { email: 'test.downline@example.com' },
      select: { id: true, name: true, email: true }
    });
    
    if (!uplineUser || !downlineUser) {
      printError('Test users not found. Please check if the test data was generated correctly.');
      process.exit(1);
    }
    
    // Get test product
    const starterPackage = await prisma.product.findUnique({
      where: { sku: 'STARTER-PKG-001' },
      select: { id: true, name: true }
    });
    
    const regularProduct = await prisma.product.findUnique({
      where: { sku: 'BIOGEN-EXTREME-001' },
      select: { id: true, name: true }
    });
    
    if (!starterPackage || !regularProduct) {
      printError('Test products not found. Please check if the test data was generated correctly.');
      process.exit(1);
    }
    
    // Display test credentials
    printHeader('TEST CREDENTIALS');
    console.log('Use the following credentials for testing:');
    console.log('\nUpline User:');
    console.log(`- Name: ${uplineUser.name}`);
    console.log(`- Email: ${uplineUser.email}`);
    console.log(`- Password: Password123`);
    console.log(`- ID: ${uplineUser.id}`);
    
    console.log('\nDownline User:');
    console.log(`- Name: ${downlineUser.name}`);
    console.log(`- Email: ${downlineUser.email}`);
    console.log(`- Password: Password123`);
    console.log(`- ID: ${downlineUser.id}`);
    
    console.log('\nTest Products:');
    console.log(`- Starter Package: ${starterPackage.name} (ID: ${starterPackage.id})`);
    console.log(`- Regular Product: ${regularProduct.name} (ID: ${regularProduct.id})`);
    
    // Guide through the test steps
    printHeader('TEST SCENARIO 1: MEMBER REGISTRATION WITH UPLINE AND PACKAGE PURCHASE');
    
    printStep(1, 'Log in as the Downline User');
    console.log(`- Navigate to http://localhost:3000/login`);
    console.log(`- Enter email: ${downlineUser.email}`);
    console.log(`- Enter password: Password123`);
    console.log(`- Click "Sign In"`);
    await prompt('Press Enter when you have completed this step...');
    
    printStep(2, 'Purchase the Starter Package');
    console.log(`- Navigate to http://localhost:3000/shop`);
    console.log(`- Find the "${starterPackage.name}" product`);
    console.log(`- Click on the product to view details`);
    console.log(`- Click "Buy Now"`);
    console.log(`- Select payment method: GCash`);
    console.log(`- Complete the purchase`);
    await prompt('Press Enter when you have completed this step...');
    
    printVerification('The purchase confirmation page shows a success message');
    printVerification('The purchase is listed in the purchases page');
    
    printStep(3, 'Verify Upline Earnings');
    console.log(`- Log out from the Downline User`);
    console.log(`- Log in as the Upline User (${uplineUser.email})`);
    console.log(`- Navigate to http://localhost:3000/wallet or http://localhost:3000/earnings`);
    await prompt('Press Enter when you have completed this step...');
    
    printVerification('A commission/rebate has been recorded for the downline\'s package purchase');
    printVerification('The amount matches the expected percentage for direct referrals');
    
    // Continue with more test scenarios
    printHeader('TEST SCENARIO 2: PRODUCT SHARING AND EARNING FROM SHARED LINKS');
    
    printStep(1, 'Create and Share Product Link');
    console.log(`- While logged in as the Upline User`);
    console.log(`- Navigate to http://localhost:3000/shop`);
    console.log(`- Select the "${regularProduct.name}" product`);
    console.log(`- Click on the "Share" button`);
    console.log(`- Copy the generated shareable link`);
    const sharedLink = await prompt('Paste the copied shareable link here: ');
    
    printStep(2, 'Purchase Through Shared Link');
    console.log(`- Log out from the Upline User`);
    console.log(`- Log in as the Downline User (${downlineUser.email})`);
    console.log(`- Open the copied shareable link in the browser: ${sharedLink}`);
    console.log(`- Verify the product page shows a referral badge`);
    console.log(`- Purchase the product`);
    await prompt('Press Enter when you have completed this step...');
    
    printVerification('The purchase confirmation shows success');
    
    printStep(3, 'Verify Referral Commissions');
    console.log(`- Log out from the Downline User`);
    console.log(`- Log in as the Upline User (${uplineUser.email})`);
    console.log(`- Navigate to http://localhost:3000/referrals or http://localhost:3000/earnings`);
    await prompt('Press Enter when you have completed this step...');
    
    printVerification('A commission has been recorded for the purchase made through the shared link');
    printVerification('The commission amount matches the product\'s referral commission structure');
    
    // Wrap up
    printHeader('TEST COMPLETED');
    console.log('You have successfully completed the MLM flow test!');
    console.log('\nSummary of what was tested:');
    console.log('1. Member registration with upline reference');
    console.log('2. Package purchase and upline earnings');
    console.log('3. Product sharing and earning from shared links');
    
    printNote('For a more comprehensive test, you can follow the detailed steps in the test documentation:');
    console.log('tests/mlm-flow-test.md');
    
  } catch (error) {
    printError(`An error occurred during the test: ${error.message}`);
    console.error(error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the test
runTest().catch(console.error);
