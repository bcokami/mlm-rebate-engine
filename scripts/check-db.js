/**
 * Check Database Script
 * 
 * This script checks the database for existing users.
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database...');
    
    // Check for users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Rank: ${user.rankId}`);
    });
    
    // Check for ranks
    const ranks = await prisma.rank.findMany();
    console.log(`\nFound ${ranks.length} ranks:`);
    
    ranks.forEach(rank => {
      console.log(`- ID: ${rank.id}, Name: ${rank.name}, Level: ${rank.level}`);
    });
    
    return { users, ranks };
  } catch (error) {
    console.error('Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabase()
  .then(() => {
    console.log('\nDatabase check completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
