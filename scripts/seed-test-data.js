const { execSync } = require('child_process');
const path = require('path');

// Run the seed script
console.log('Seeding test data...');
try {
  execSync('npx ts-node prisma/seed-test-data.ts', { stdio: 'inherit' });
  console.log('Seeding completed successfully!');
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}

console.log('Setup completed successfully!');
