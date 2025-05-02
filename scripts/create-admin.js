/**
 * Create Admin User Script
 * 
 * This script creates an admin user with Diamond rank (6).
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating ranks...');
    
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
    
    console.log('Ranks created successfully!');
    
    // Create admin user
    console.log('Creating admin user...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        rank: {
          connect: { level: 6 } // Diamond rank
        }
      },
    });
    
    console.log(`Admin user created with ID: ${admin.id}`);
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    return admin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('Admin user creation completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
