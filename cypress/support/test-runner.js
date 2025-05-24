/**
 * Comprehensive Test Runner for MLM Rebate Engine
 * 
 * This script runs all test suites and generates a comprehensive report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      summary: {
        totalSpecs: 0,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      specs: [],
      startTime: new Date(),
      endTime: null
    };
  }

  /**
   * Get all test files in the e2e directory
   */
  getTestFiles() {
    const e2eDir = path.join(__dirname, '../e2e');
    const files = fs.readdirSync(e2eDir)
      .filter(file => file.endsWith('.cy.js'))
      .sort();
    
    return files;
  }

  /**
   * Run a single test spec
   */
  async runSpec(specFile) {
    console.log(`\n🧪 Running: ${specFile}`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    let result = {
      spec: specFile,
      status: 'unknown',
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      error: null
    };

    try {
      const output = execSync(
        `npx cypress run --spec "cypress/e2e/${specFile}"`,
        { 
          encoding: 'utf8',
          timeout: 300000, // 5 minutes timeout
          cwd: process.cwd()
        }
      );

      // Parse output for results
      if (output.includes('All specs passed!')) {
        result.status = 'passed';
        // Extract numbers from output
        const passedMatch = output.match(/(\d+)\s+passing/);
        if (passedMatch) {
          result.tests = parseInt(passedMatch[1]);
          result.passed = parseInt(passedMatch[1]);
        }
      } else if (output.includes('failing')) {
        result.status = 'failed';
        const failedMatch = output.match(/(\d+)\s+failing/);
        const passedMatch = output.match(/(\d+)\s+passing/);
        if (failedMatch) result.failed = parseInt(failedMatch[1]);
        if (passedMatch) result.passed = parseInt(passedMatch[1]);
        result.tests = result.passed + result.failed;
      }

    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);
    }

    result.duration = Date.now() - startTime;
    
    // Log result
    const statusIcon = result.status === 'passed' ? '✅' : '❌';
    console.log(`${statusIcon} ${specFile}: ${result.passed}/${result.tests} passed (${result.duration}ms)`);
    
    return result;
  }

  /**
   * Run all test specs
   */
  async runAllSpecs() {
    console.log('🚀 Starting MLM Rebate Engine Test Suite');
    console.log('═'.repeat(60));
    
    const testFiles = this.getTestFiles();
    console.log(`Found ${testFiles.length} test files`);
    
    // Prioritize critical tests first
    const prioritizedTests = this.prioritizeTests(testFiles);
    
    for (const specFile of prioritizedTests) {
      const result = await this.runSpec(specFile);
      this.results.specs.push(result);
      
      // Update summary
      this.results.summary.totalSpecs++;
      this.results.summary.totalTests += result.tests;
      this.results.summary.passed += result.passed;
      this.results.summary.failed += result.failed;
      this.results.summary.skipped += result.skipped;
      this.results.summary.duration += result.duration;
    }
    
    this.results.endTime = new Date();
    return this.results;
  }

  /**
   * Prioritize tests - run critical tests first
   */
  prioritizeTests(testFiles) {
    const priority = {
      high: ['absolute-pass.cy.js', 'admin-login.cy.js', 'authentication.cy.js'],
      medium: ['user-flows.cy.js', 'genealogy.cy.js', 'user-ranks.cy.js'],
      low: []
    };

    const prioritized = [];
    
    // Add high priority tests first
    priority.high.forEach(file => {
      if (testFiles.includes(file)) {
        prioritized.push(file);
      }
    });
    
    // Add medium priority tests
    priority.medium.forEach(file => {
      if (testFiles.includes(file)) {
        prioritized.push(file);
      }
    });
    
    // Add remaining tests
    testFiles.forEach(file => {
      if (!prioritized.includes(file)) {
        prioritized.push(file);
      }
    });
    
    return prioritized;
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      specs: this.results.specs,
      recommendations: this.generateRecommendations()
    };

    // Console report
    this.printConsoleReport();
    
    // Save JSON report
    const reportPath = path.join(__dirname, '../reports/test-results.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    return report;
  }

  /**
   * Print console report
   */
  printConsoleReport() {
    console.log('\n');
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Specs: ${this.results.summary.totalSpecs}`);
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.results.summary.skipped}`);
    console.log(`⏱️  Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
    
    const successRate = this.results.summary.totalTests > 0 
      ? ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)
      : 0;
    console.log(`📈 Success Rate: ${successRate}%`);
    
    console.log('\n📋 SPEC RESULTS:');
    console.log('─'.repeat(60));
    
    this.results.specs.forEach(spec => {
      const statusIcon = spec.status === 'passed' ? '✅' : '❌';
      const duration = (spec.duration / 1000).toFixed(2);
      console.log(`${statusIcon} ${spec.spec.padEnd(30)} ${spec.passed}/${spec.tests} (${duration}s)`);
    });
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    const failedSpecs = this.results.specs.filter(spec => spec.status === 'failed');
    
    if (failedSpecs.length > 0) {
      recommendations.push({
        type: 'critical',
        title: 'Fix Failing Tests',
        description: `${failedSpecs.length} test specs are failing and need immediate attention`,
        specs: failedSpecs.map(spec => spec.spec)
      });
    }
    
    const slowSpecs = this.results.specs.filter(spec => spec.duration > 30000);
    if (slowSpecs.length > 0) {
      recommendations.push({
        type: 'performance',
        title: 'Optimize Slow Tests',
        description: 'Some tests are taking longer than 30 seconds to execute',
        specs: slowSpecs.map(spec => ({ spec: spec.spec, duration: spec.duration }))
      });
    }
    
    if (this.results.summary.skipped > 0) {
      recommendations.push({
        type: 'coverage',
        title: 'Review Skipped Tests',
        description: `${this.results.summary.skipped} tests are being skipped`,
        action: 'Review and enable skipped tests to improve coverage'
      });
    }
    
    return recommendations;
  }
}

module.exports = TestRunner;

// If run directly, execute the test runner
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllSpecs()
    .then(results => {
      runner.generateReport();
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}
