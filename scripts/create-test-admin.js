/**
 * Create Test Admin User
 *
 * This script creates a test admin user with a known password.
 * It's useful for testing when other user creation methods fail.
 */

const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

// Test user credentials
const TEST_USER = {
  name: 'Test Admin',
  email: 'testadmin@example.com',
  password: 'Test@123'
};

async function main() {
  try {
    console.log('Creating test admin user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });

    if (existingUser) {
      console.log(`User ${TEST_USER.email} already exists. Updating password...`);

      // Hash password
      const hashedPassword = await bcryptjs.hash(TEST_USER.password, 10);

      // Update user
      await prisma.user.update({
        where: { email: TEST_USER.email },
        data: {
          password: hashedPassword,
          testData: true,
          cleanupToken: 'test-admin-user'
        }
      });

      console.log(`Updated password for ${TEST_USER.email}`);
    } else {
      // Hash password
      const hashedPassword = await bcryptjs.hash(TEST_USER.password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name: TEST_USER.name,
          email: TEST_USER.email,
          password: hashedPassword,
          testData: true,
          cleanupToken: 'test-admin-user',
          // Set rankId to 1 (default rank)
          rankId: 1
        }
      });

      console.log(`Created test admin user: ${newUser.name} (${newUser.email})`);

      // Create wallet for the user
      await prisma.wallet.upsert({
        where: { userId: newUser.id },
        update: { balance: 0 },
        create: { userId: newUser.id, balance: 0 }
      });

      console.log(`Created wallet for user: ${newUser.email}`);
    }

    console.log('\nTest Admin User Credentials:');
    console.log('---------------------------');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    console.log('---------------------------');
    console.log('You can now log in with these credentials.');

  } catch (error) {
    console.error('Error creating test admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error);
