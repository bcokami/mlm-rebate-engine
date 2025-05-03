const { execSync } = require('child_process');
const path = require('path');

// Run the migration
console.log('Running migration for rank requirements...');
try {
  execSync('npx prisma migrate dev --name add_rank_requirements', { stdio: 'inherit' });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

// Run the seed script
console.log('Seeding rank requirements...');
try {
  execSync('npx ts-node prisma/seed-rank-requirements.ts', { stdio: 'inherit' });
  console.log('Seeding completed successfully!');
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}

console.log('Setup completed successfully!');
