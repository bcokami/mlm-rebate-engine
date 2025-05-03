const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting test users creation...');

    // Check if ranks exist, if not create them
    const ranksCount = await prisma.rank.count();
    
    if (ranksCount === 0) {
      console.log('Creating ranks...');
      await prisma.rank.createMany({
        data: [
          { name: 'Starter', level: 1, description: 'Entry level rank' },
          { name: 'Bronze', level: 2, description: 'Bronze level rank' },
          { name: 'Silver', level: 3, description: 'Silver level rank' },
          { name: 'Gold', level: 4, description: 'Gold level rank' },
          { name: 'Platinum', level: 5, description: 'Platinum level rank' },
          { name: 'Diamond', level: 6, description: 'Diamond level rank' },
        ],
      });
      console.log('Ranks created successfully!');
    } else {
      console.log('Ranks already exist, skipping creation.');
    }

    // Get the admin user to set as upline
    const adminUser = await prisma.user.findFirst({
      where: { rankId: 6 },
    });

    if (!adminUser) {
      console.error('No admin user found. Please run add-admin-user.js first.');
      process.exit(1);
    }

    // Hash the password using bcrypt (10 rounds)
    const password = 'Test@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Password hashed successfully.`);

    // Create test users for each rank
    const ranks = await prisma.rank.findMany({
      orderBy: { level: 'asc' },
    });

    console.log('Creating test users for each rank...');
    
    const createdUsers = [];
    
    for (const rank of ranks) {
      const email = `test-${rank.name.toLowerCase()}@extremelife.ph`;
      const name = `Test ${rank.name} User`;
      
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          password: hashedPassword,
          rankId: rank.id,
          uplineId: adminUser.id,
        },
        create: {
          email,
          name,
          password: hashedPassword,
          rankId: rank.id,
          uplineId: adminUser.id,
          walletBalance: rank.level * 1000, // Just for testing
        },
      });
      
      createdUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        rank: rank.name,
        rankId: rank.id,
      });
    }

    console.log('\nTest users created/updated successfully!');
    console.log('\nUser Credentials:');
    console.log('----------------');
    console.log(`Password for all test users: ${password}`);
    console.log('\nCreated Users:');
    
    createdUsers.forEach(user => {
      console.log(`\nName: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Rank: ${user.rank} (ID: ${user.rankId})`);
      console.log(`User ID: ${user.id}`);
      console.log(`Admin Access: ${user.rankId === 6 ? 'Yes' : 'No'}`);
    });

    console.log('\nYou can now log in with these credentials to test different rank access levels.');

  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
