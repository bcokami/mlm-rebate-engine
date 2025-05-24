const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    // Performance optimizations
    numTestsKeptInMemory: 5,
    experimentalMemoryManagement: true,
    videoCompression: 15,
  },
  env: {
    // Test user credentials (fallback when fixtures are not used)
    testUser: {
      email: 'test@example.com',
      password: 'Password@123',
    },
    adminUser: {
      email: 'admin@test.com',
      password: 'Test@123',
    },
    distributor: {
      email: 'distributor@example.com',
      password: 'Distributor@123',
    },
    silver: {
      email: 'silver@example.com',
      password: 'Silver@123',
    },
    gold: {
      email: 'gold@example.com',
      password: 'Gold@123',
    },
    platinum: {
      email: 'platinum@example.com',
      password: 'Platinum@123',
    },
    // Use fixtures for test users (recommended)
    useFixtures: true,
  },
});
