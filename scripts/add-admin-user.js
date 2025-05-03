const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting admin user creation...');

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

    // Create admin user with Diamond rank (rankId 6)
    const email = 'superadmin@extremelife.ph';
    const password = 'Admin@123'; // Strong password
    const name = 'Super Admin';

    // Hash the password using bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Password hashed successfully.`);

    // Create or update the admin user
    const adminUser = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        rankId: 6, // Diamond rank
      },
      create: {
        email,
        name,
        password: hashedPassword,
        rankId: 6, // Diamond rank
        walletBalance: 0,
      },
    });

    console.log(`Admin user created/updated successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${adminUser.id}`);
    console.log(`Rank: Diamond (ID: 6)`);
    console.log('\nYou can now log in with these credentials to access the admin panel.');

  } catch (error) {
    console.error('Error creating admin user:', error);
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
