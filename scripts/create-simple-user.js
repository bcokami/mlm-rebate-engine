// Simple script to create a test user
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // User details
    const email = 'simple@test.com';
    const password = 'Test@123';
    const name = 'Simple Test User';

    // Check if ranks exist
    console.log('Checking if ranks exist...');
    const ranks = await prisma.rank.findMany();

    if (ranks.length === 0) {
      console.log('Creating default rank...');
      await prisma.rank.create({
        data: {
          name: 'New Distributor',
          level: 1,
          description: 'Basic distributor rank'
        }
      });
      console.log('Default rank created.');
    } else {
      console.log(`Found ${ranks.length} ranks.`);
      ranks.forEach(rank => {
        console.log(`- Rank: ${rank.name} (ID: ${rank.id}, Level: ${rank.level})`);
      });
    }

    // Get the first rank
    const firstRank = await prisma.rank.findFirst({
      orderBy: { level: 'asc' }
    });

    if (!firstRank) {
      throw new Error('No ranks found in the database.');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update password
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      console.log(`Updated password for user: ${email}`);
    } else {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          rankId: firstRank.id
        }
      });
      console.log(`Created user: ${user.email}`);

      // Create wallet if the model exists
      if (prisma.wallet) {
        try {
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: 0
            }
          });
          console.log(`Created wallet for user: ${user.email}`);
        } catch (walletError) {
          console.log(`Note: Could not create wallet - ${walletError.message}`);
        }
      } else {
        console.log('Note: Wallet model not available in this schema');
      }
    }

    console.log('Done!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
