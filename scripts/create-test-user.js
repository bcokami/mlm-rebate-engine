/**
 * Create Test User Script
 * 
 * This script creates a test user with a known password for testing login.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Create ranks if they don't exist
    const ranks = [
      { name: "Starter", level: 1, description: "Entry level rank" },
      { name: "Bronze", level: 2, description: "Bronze level rank" },
      { name: "Silver", level: 3, description: "Silver level rank" },
      { name: "Gold", level: 4, description: "Gold level rank" },
      { name: "Platinum", level: 5, description: "Platinum level rank" },
      { name: "Diamond", level: 6, description: "Diamond level rank" },
    ];

    for (const rank of ranks) {
      await prisma.rank.upsert({
        where: { level: rank.level },
        update: {},
        create: rank,
      });
    }
    
    // Create test user
    const testPassword = await bcrypt.hash('password123', 10);
    
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: testPassword
      },
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: testPassword,
        rank: {
          connect: { level: 1 } // Starter rank
        }
      },
    });
    
    console.log(`Test user created/updated with ID: ${testUser.id}`);
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: adminPassword
      },
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        rank: {
          connect: { level: 6 } // Diamond rank
        }
      },
    });
    
    console.log(`Admin user created/updated with ID: ${admin.id}`);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    return { testUser, admin };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser()
  .then(() => {
    console.log('Test user creation completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
