const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding test users...');

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
  }

  // Create test users with different ranks
  console.log('Creating test users...');
  
  // Hash passwords
  const passwordHash = hashPassword('password123');
  
  // Create admin user (Diamond rank)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: passwordHash,
      rankId: 6, // Diamond
      walletBalance: 10000,
    },
  });
  
  // Create manager user (Platinum rank)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: passwordHash,
      rankId: 5, // Platinum
      uplineId: adminUser.id,
      walletBalance: 5000,
    },
  });
  
  // Create distributor user (Gold rank)
  const distributorUser = await prisma.user.upsert({
    where: { email: 'distributor@example.com' },
    update: {},
    create: {
      email: 'distributor@example.com',
      name: 'Distributor User',
      password: passwordHash,
      rankId: 4, // Gold
      uplineId: managerUser.id,
      walletBalance: 2500,
    },
  });
  
  // Create regular users with different ranks
  for (let i = 1; i <= 3; i++) {
    const rankId = i + 1; // Ranks 2-4 (Bronze, Silver, Gold)
    const uplineId = i === 1 ? distributorUser.id : null;
    
    await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        name: `Regular User ${i}`,
        password: passwordHash,
        rankId,
        uplineId,
        walletBalance: 1000 * i,
      },
    });
  }
  
  console.log('Test users seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
