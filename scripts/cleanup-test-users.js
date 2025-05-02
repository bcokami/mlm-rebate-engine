/**
 * MLM Test User Cleanup
 * 
 * This script removes test users from the database based on environment and retention flags.
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration options (can be overridden via command line arguments)
const DEFAULT_CONFIG = {
  environment: 'development', // 'development' or 'staging'
  retainKeyTesters: true, // Whether to keep users with keepForDev = true
  dryRun: false, // If true, only show what would be deleted without actually deleting
};

// Parse command line arguments
const args = process.argv.slice(2);
const config = { ...DEFAULT_CONFIG };

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'environment' && (value === 'development' || value === 'staging')) {
    config[key] = value;
  } else if (key === 'retainKeyTesters' || key === 'dryRun') {
    config[key] = value === 'true';
  }
}

// Main function to clean up test users
async function cleanupTestUsers() {
  console.log(`Cleaning up test users for ${config.environment} environment...`);
  console.log(`Retain key testers: ${config.retainKeyTesters}`);
  console.log(`Dry run: ${config.dryRun}`);
  
  try {
    // Find all test users for the specified environment
    const testUsers = await prisma.user.findMany({
      where: {
        metadata: {
          path: ['isTest'],
          equals: true,
        },
        AND: {
          metadata: {
            path: ['environment'],
            equals: config.environment,
          },
        },
      },
    });
    
    console.log(`Found ${testUsers.length} test users in ${config.environment} environment.`);
    
    // Filter users based on retention flag
    const usersToDelete = testUsers.filter(user => {
      const keepForDev = user.metadata?.keepForDev || false;
      return !(config.retainKeyTesters && keepForDev);
    });
    
    console.log(`${usersToDelete.length} users will be deleted.`);
    
    if (usersToDelete.length === 0) {
      console.log('No users to delete.');
      return { deleted: 0, retained: testUsers.length };
    }
    
    // Show users that will be deleted
    console.log('Users to be deleted:');
    usersToDelete.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    // Show users that will be retained
    const retainedUsers = testUsers.filter(user => !usersToDelete.includes(user));
    console.log(`${retainedUsers.length} users will be retained.`);
    
    if (retainedUsers.length > 0) {
      console.log('Users to be retained:');
      retainedUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // If this is a dry run, stop here
    if (config.dryRun) {
      console.log('Dry run completed. No users were deleted.');
      return { deleted: 0, retained: testUsers.length };
    }
    
    // Delete users in a transaction to ensure all related data is deleted
    const result = await prisma.$transaction(async (tx) => {
      // Get all user IDs to delete
      const userIds = usersToDelete.map(user => user.id);
      
      // Delete related data first to avoid foreign key constraints
      // Delete wallet transactions
      await tx.walletTransaction.deleteMany({
        where: { userId: { in: userIds } },
      });
      
      // Delete rebates where user is receiver or generator
      await tx.rebate.deleteMany({
        where: {
          OR: [
            { receiverId: { in: userIds } },
            { generatorId: { in: userIds } },
          ],
        },
      });
      
      // Delete purchases
      await tx.purchase.deleteMany({
        where: { userId: { in: userIds } },
      });
      
      // Update users to remove upline references
      await tx.user.updateMany({
        where: { uplineId: { in: userIds } },
        data: { uplineId: null },
      });
      
      // Finally, delete the users
      const deleteResult = await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
      
      return deleteResult;
    });
    
    console.log(`Successfully deleted ${result.count} test users.`);
    return { deleted: result.count, retained: retainedUsers.length };
  } catch (error) {
    console.error('Error cleaning up test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestUsers()
    .then(result => {
      console.log(`Test user cleanup completed successfully!`);
      console.log(`Deleted: ${result.deleted}, Retained: ${result.retained}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupTestUsers };
