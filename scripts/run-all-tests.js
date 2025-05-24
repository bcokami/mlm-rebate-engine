/**
 * Script to run all Cypress tests
 *
 * This script runs all Cypress tests and generates a report.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test suites to run
const testSuites = [
  { name: 'Basic', spec: 'absolute-pass.cy.js' },
  { name: 'Comprehensive', spec: 'comprehensive.cy.js' },
  { name: 'Visual Regression', spec: 'visual-regression.cy.js' },
  { name: 'Performance', spec: 'performance.cy.js' },
  { name: 'Accessibility', spec: 'accessibility.cy.js' },
  { name: 'User Flows', spec: 'user-flows.cy.js' },
  { name: 'Error Handling', spec: 'error-handling.cy.js' },
  { name: 'Mobile Features', spec: 'mobile-features.cy.js' },
  { name: 'Security Features', spec: 'security-features.cy.js' },
  { name: 'Authentication', spec: 'authentication.cy.js' },
  { name: 'User Ranks', spec: 'user-ranks.cy.js' }
];

// Results storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: []
};

// Function to run Cypress tests
function runCypressTests(spec) {
  return new Promise((resolve, reject) => {
    const cypressPath = path.resolve('./node_modules/.bin/cypress');

    // Build command arguments
    const cmdArgs = ['run', '--spec', `cypress/e2e/${spec}`, '--config', 'video=true'];

    console.log(`Running command: ${cypressPath} ${cmdArgs.join(' ')}`);

    // Spawn Cypress process
    const cypressProcess = spawn(cypressPath, cmdArgs, {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    cypressProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });

    cypressProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
    });

    cypressProcess.on('close', (code) => {
      resolve({
        code,
        output
      });
    });
  });
}

// Function to parse test results
function parseResults(output) {
  const result = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Try to extract test counts
  const totalMatch = output.match(/Running:\s+(\d+)\s+of\s+(\d+)/);
  if (totalMatch && totalMatch[2]) {
    result.total = parseInt(totalMatch[2], 10);
  }

  const passedMatch = output.match(/✓\s+(\d+)\s+passing/);
  if (passedMatch && passedMatch[1]) {
    result.passed = parseInt(passedMatch[1], 10);
  }

  const failedMatch = output.match(/✗\s+(\d+)\s+failing/);
  if (failedMatch && failedMatch[1]) {
    result.failed = parseInt(failedMatch[1], 10);
  }

  const skippedMatch = output.match(/\s+(\d+)\s+pending/);
  if (skippedMatch && skippedMatch[1]) {
    result.skipped = parseInt(skippedMatch[1], 10);
  }

  return result;
}

// Function to generate a simple HTML report
function generateReport(results) {
  const reportPath = path.resolve('./cypress/reports/test-report.html');

  // Create reports directory if it doesn't exist
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cypress Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item h3 {
      margin: 0;
    }
    .summary-item p {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    .passed { color: #27ae60; }
    .failed { color: #e74c3c; }
    .skipped { color: #f39c12; }
    .total { color: #2980b9; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .timestamp {
      text-align: right;
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <h1>Cypress Test Report</h1>

  <div class="summary">
    <div class="summary-item">
      <h3>Total</h3>
      <p class="total">${results.total}</p>
    </div>
    <div class="summary-item">
      <h3>Passed</h3>
      <p class="passed">${results.passed}</p>
    </div>
    <div class="summary-item">
      <h3>Failed</h3>
      <p class="failed">${results.failed}</p>
    </div>
    <div class="summary-item">
      <h3>Skipped</h3>
      <p class="skipped">${results.skipped}</p>
    </div>
  </div>

  <h2>Test Suites</h2>

  <table>
    <thead>
      <tr>
        <th>Suite</th>
        <th>Total</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${results.suites.map(suite => `
        <tr>
          <td>${suite.name}</td>
          <td>${suite.results.total}</td>
          <td class="passed">${suite.results.passed}</td>
          <td class="failed">${suite.results.failed}</td>
          <td class="skipped">${suite.results.skipped}</td>
          <td>${suite.code === 0 ? '<span class="passed">✓ Passed</span>' : '<span class="failed">✗ Failed</span>'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p class="timestamp">Report generated on ${new Date().toLocaleString()}</p>
</body>
</html>
  `;

  // Write HTML to file
  fs.writeFileSync(reportPath, html);

  console.log(`Report generated at ${reportPath}`);

  return reportPath;
}

// Main function
async function main() {
  console.log('Starting test run...');

  // Run each test suite
  for (const suite of testSuites) {
    console.log(`\nRunning ${suite.name} tests...`);

    try {
      const { code, output } = await runCypressTests(suite.spec);
      const suiteResults = parseResults(output);

      // Update overall results
      results.total += suiteResults.total;
      results.passed += suiteResults.passed;
      results.failed += suiteResults.failed;
      results.skipped += suiteResults.skipped;

      // Add suite results
      results.suites.push({
        name: suite.name,
        code,
        results: suiteResults
      });

      console.log(`${suite.name} tests completed with exit code ${code}`);
    } catch (error) {
      console.error(`Error running ${suite.name} tests:`, error);

      // Add failed suite
      results.suites.push({
        name: suite.name,
        code: 1,
        results: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        }
      });
    }
  }

  // Generate report
  const reportPath = generateReport(results);

  // Print summary
  console.log('\nTest Run Summary:');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the main function
main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
