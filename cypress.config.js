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
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
  },
  env: {
    testUser: {
      email: 'test@example.com',
      password: 'Password123',
    },
    adminUser: {
      email: 'testadmin@example.com',
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
    useFixtures: true, // Set to true to use fixtures instead of env variables
  },
});
