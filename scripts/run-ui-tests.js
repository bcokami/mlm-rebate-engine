/**
 * Script to run UI tests for the MLM Rebate Engine
 * 
 * This script runs Cypress tests for the MLM application.
 * It can run all tests or specific test suites.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const testSuite = args[0];

// Available test suites
const availableTestSuites = [
  'login',
  'registration',
  'dashboard',
  'products',
  'rebates',
  'genealogy',
  'checkout',
  'all'
];

// Check if test suite is valid
if (testSuite && !availableTestSuites.includes(testSuite)) {
  console.error(`Error: Invalid test suite "${testSuite}"`);
  console.error(`Available test suites: ${availableTestSuites.join(', ')}`);
  process.exit(1);
}

// Function to run Cypress tests
function runCypressTests(spec) {
  return new Promise((resolve, reject) => {
    const cypressPath = path.resolve('./node_modules/.bin/cypress');
    
    // Build command arguments
    const cmdArgs = ['run'];
    
    if (spec && spec !== 'all') {
      cmdArgs.push('--spec', `cypress/e2e/${spec}.cy.js`);
    }
    
    // Add additional arguments
    cmdArgs.push('--config', 'video=true');
    
    console.log(`Running command: ${cypressPath} ${cmdArgs.join(' ')}`);
    
    // Spawn Cypress process
    const cypressProcess = spawn(cypressPath, cmdArgs, {
      stdio: 'inherit',
      shell: true
    });
    
    cypressProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cypress tests failed with exit code ${code}`));
      }
    });
  });
}

// Function to check if application is running
async function isApplicationRunning() {
  try {
    const response = await fetch('http://localhost:3000', { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting UI tests...');
    
    // Check if the application is running
    console.log('Checking if application is running...');
    const isRunning = await isApplicationRunning();
    
    if (!isRunning) {
      console.warn('Warning: Application does not appear to be running at http://localhost:3000');
      console.warn('Tests may fail if the application is not running.');
    } else {
      console.log('Application is running at http://localhost:3000');
    }
    
    // Run tests
    if (!testSuite || testSuite === 'all') {
      console.log('Running all test suites...');
      await runCypressTests('all');
    } else {
      console.log(`Running test suite: ${testSuite}`);
      await runCypressTests(testSuite);
    }
    
    console.log('UI tests completed successfully!');
  } catch (error) {
    console.error('Error running UI tests:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
