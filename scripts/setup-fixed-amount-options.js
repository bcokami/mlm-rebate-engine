const { execSync } = require('child_process');
const path = require('path');

// Run the migration
console.log('Running migration for fixed amount options...');
try {
  execSync('npx prisma migrate dev --name add_fixed_amount_options', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

console.log('Setup completed successfully!');
