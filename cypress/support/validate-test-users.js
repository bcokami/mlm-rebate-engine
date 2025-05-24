/**
 * Test User Validation Script
 * 
 * This script validates that all test users are properly configured
 * and can be used in Cypress tests.
 */

// Load test users from fixture
const testUsers = require('../fixtures/test-users.json');

/**
 * Validates a single test user object
 * @param {string} userKey - The key of the user (e.g., 'admin', 'regularUser')
 * @param {object} user - The user object to validate
 * @returns {object} Validation result
 */
function validateUser(userKey, user) {
  const errors = [];
  const warnings = [];

  // Required fields
  const requiredFields = ['name', 'email', 'role', 'password'];
  requiredFields.forEach(field => {
    if (!user[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Email validation
  if (user.email && !user.email.includes('@')) {
    errors.push('Invalid email format');
  }

  // Password validation
  if (user.password) {
    if (user.password.length < 8) {
      warnings.push('Password is shorter than 8 characters');
    }
    if (!/[A-Z]/.test(user.password)) {
      warnings.push('Password should contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(user.password)) {
      warnings.push('Password should contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(user.password)) {
      warnings.push('Password should contain at least one special character');
    }
  }

  // Role validation
  const validRoles = ['Admin', 'User', 'Distributor', 'Silver', 'Gold', 'Platinum'];
  if (user.role && !validRoles.includes(user.role)) {
    warnings.push(`Role '${user.role}' is not in the standard list: ${validRoles.join(', ')}`);
  }

  return {
    userKey,
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates all test users
 * @returns {object} Complete validation report
 */
function validateAllUsers() {
  const results = [];
  const summary = {
    total: 0,
    valid: 0,
    invalid: 0,
    totalErrors: 0,
    totalWarnings: 0
  };

  Object.keys(testUsers).forEach(userKey => {
    const result = validateUser(userKey, testUsers[userKey]);
    results.push(result);
    
    summary.total++;
    if (result.valid) {
      summary.valid++;
    } else {
      summary.invalid++;
    }
    summary.totalErrors += result.errors.length;
    summary.totalWarnings += result.warnings.length;
  });

  return {
    results,
    summary,
    testUsers
  };
}

/**
 * Prints validation report to console
 * @param {object} report - Validation report from validateAllUsers()
 */
function printValidationReport(report) {
  console.log('\n=== Test User Validation Report ===\n');
  
  // Summary
  console.log('Summary:');
  console.log(`  Total users: ${report.summary.total}`);
  console.log(`  Valid users: ${report.summary.valid}`);
  console.log(`  Invalid users: ${report.summary.invalid}`);
  console.log(`  Total errors: ${report.summary.totalErrors}`);
  console.log(`  Total warnings: ${report.summary.totalWarnings}`);
  console.log('');

  // Individual results
  report.results.forEach(result => {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.userKey} (${report.testUsers[result.userKey].role})`);
    console.log(`    Email: ${report.testUsers[result.userKey].email}`);
    
    if (result.errors.length > 0) {
      console.log('    Errors:');
      result.errors.forEach(error => console.log(`      - ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log('    Warnings:');
      result.warnings.forEach(warning => console.log(`      - ${warning}`));
    }
    console.log('');
  });

  // Recommendations
  if (report.summary.totalErrors > 0 || report.summary.totalWarnings > 0) {
    console.log('Recommendations:');
    if (report.summary.totalErrors > 0) {
      console.log('  - Fix all errors before running tests');
    }
    if (report.summary.totalWarnings > 0) {
      console.log('  - Consider addressing warnings for better security');
    }
    console.log('');
  }
}

/**
 * Checks if all required Cypress commands exist for the test users
 * @returns {object} Command validation report
 */
function validateCypressCommands() {
  const expectedCommands = [
    'loginAsAdmin',
    'loginAsTestUser', 
    'loginAsDistributor',
    'loginAsSilver',
    'loginAsGold',
    'loginAsPlatinum'
  ];

  const userKeys = Object.keys(testUsers);
  const missingCommands = [];

  // Check if we have commands for all users
  userKeys.forEach(userKey => {
    let expectedCommand;
    switch(userKey) {
      case 'admin':
        expectedCommand = 'loginAsAdmin';
        break;
      case 'regularUser':
        expectedCommand = 'loginAsTestUser';
        break;
      default:
        expectedCommand = `loginAs${userKey.charAt(0).toUpperCase() + userKey.slice(1)}`;
    }

    if (!expectedCommands.includes(expectedCommand)) {
      missingCommands.push(`${expectedCommand} (for ${userKey})`);
    }
  });

  return {
    expectedCommands,
    missingCommands,
    allCommandsExist: missingCommands.length === 0
  };
}

// Export functions for use in tests or scripts
module.exports = {
  validateUser,
  validateAllUsers,
  printValidationReport,
  validateCypressCommands,
  testUsers
};

// If this script is run directly, perform validation
if (require.main === module) {
  const report = validateAllUsers();
  printValidationReport(report);
  
  const commandReport = validateCypressCommands();
  console.log('=== Cypress Commands Validation ===\n');
  console.log(`Expected commands: ${commandReport.expectedCommands.join(', ')}`);
  if (commandReport.missingCommands.length > 0) {
    console.log(`❌ Missing commands: ${commandReport.missingCommands.join(', ')}`);
  } else {
    console.log('✅ All required commands are available');
  }
  
  process.exit(report.summary.totalErrors > 0 ? 1 : 0);
}
