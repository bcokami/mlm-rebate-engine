import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

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
  const passwordHash = await bcrypt.hash('password123', 10);
  
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
  const regularUsers = [];
  
  for (let i = 1; i <= 3; i++) {
    const rankId = i + 1; // Ranks 2-4 (Bronze, Silver, Gold)
    const uplineId = i === 1 ? distributorUser.id : regularUsers[i - 2].id;
    
    const user = await prisma.user.upsert({
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
    
    regularUsers.push(user);
  }
  
  // Create some products
  console.log('Creating products...');
  
  const products = [
    {
      name: 'Basic Package',
      description: 'Entry level product package',
      price: 1000,
      active: true,
    },
    {
      name: 'Premium Package',
      description: 'Mid-tier product package with additional benefits',
      price: 2500,
      active: true,
    },
    {
      name: 'Elite Package',
      description: 'Top-tier product package with all benefits',
      price: 5000,
      active: true,
    },
  ];
  
  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product,
    });
  }
  
  // Get all products
  const allProducts = await prisma.product.findMany();
  
  // Create rebate configurations
  console.log('Creating rebate configurations...');
  
  // For each product, create percentage-based and fixed-amount rebate configs
  for (const product of allProducts) {
    // Create percentage-based rebate configs for levels 1-5
    for (let level = 1; level <= 5; level++) {
      const percentage = 10 - (level - 1) * 1.5; // 10%, 8.5%, 7%, 5.5%, 4%
      
      await prisma.rebateConfig.upsert({
        where: {
          productId_level: {
            productId: product.id,
            level,
          },
        },
        update: {
          rewardType: 'percentage',
          percentage,
          fixedAmount: 0,
        },
        create: {
          productId: product.id,
          level,
          rewardType: 'percentage',
          percentage,
          fixedAmount: 0,
        },
      });
    }
    
    // Create fixed-amount rebate config for level 6
    await prisma.rebateConfig.upsert({
      where: {
        productId_level: {
          productId: product.id,
          level: 6,
        },
      },
      update: {
        rewardType: 'fixed',
        percentage: 0,
        fixedAmount: product.price * 0.02, // 2% of product price as fixed amount
      },
      create: {
        productId: product.id,
        level: 6,
        rewardType: 'fixed',
        percentage: 0,
        fixedAmount: product.price * 0.02,
      },
    });
  }
  
  // Create referral rewards
  console.log('Creating referral rewards...');
  
  await prisma.referralReward.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Standard Referral',
      description: 'Standard referral reward for bringing in new distributors',
      rewardType: 'fixed',
      amount: 500,
      percentage: 0,
      active: true,
    },
  });
  
  await prisma.referralReward.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Premium Referral',
      description: 'Premium referral reward for bringing in new distributors who purchase premium packages',
      rewardType: 'percentage',
      amount: 0,
      percentage: 5,
      active: true,
    },
  });
  
  // Create bonus rewards
  console.log('Creating bonus rewards...');
  
  await prisma.bonusReward.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Rank Advancement Bonus',
      description: 'Bonus for advancing to a higher rank',
      rewardType: 'fixed',
      amount: 1000,
      percentage: 0,
      triggerType: 'rank_advancement',
      triggerValue: JSON.stringify({ minRankId: 3 }), // Silver or higher
      active: true,
    },
  });
  
  await prisma.bonusReward.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Sales Milestone Bonus',
      description: 'Bonus for reaching a sales milestone',
      rewardType: 'percentage',
      amount: 0,
      percentage: 2,
      triggerType: 'sales_milestone',
      triggerValue: JSON.stringify({ minAmount: 10000 }),
      active: true,
    },
  });
  
  // Create some purchases
  console.log('Creating purchases...');
  
  // Each user makes a purchase
  const users = [adminUser, managerUser, distributorUser, ...regularUsers];
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const product = allProducts[i % allProducts.length];
    
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
        totalAmount: product.price,
        status: 'completed',
      },
    });
    
    // Generate rebates for this purchase
    console.log(`Generating rebates for purchase by ${user.name}...`);
    
    // Get upline chain
    let currentUser = user;
    let level = 1;
    
    while (currentUser.uplineId && level <= 6) {
      const upline = await prisma.user.findUnique({
        where: { id: currentUser.uplineId },
      });
      
      if (!upline) break;
      
      // Find rebate config for this level
      const rebateConfig = await prisma.rebateConfig.findUnique({
        where: {
          productId_level: {
            productId: product.id,
            level,
          },
        },
      });
      
      if (rebateConfig) {
        // Calculate rebate amount
        let rebateAmount = 0;
        
        if (rebateConfig.rewardType === 'percentage') {
          rebateAmount = (product.price * rebateConfig.percentage) / 100;
        } else {
          rebateAmount = rebateConfig.fixedAmount;
        }
        
        // Create rebate
        await prisma.rebate.create({
          data: {
            purchaseId: purchase.id,
            receiverId: upline.id,
            generatorId: user.id,
            level,
            rewardType: rebateConfig.rewardType,
            percentage: rebateConfig.percentage,
            amount: rebateAmount,
            status: Math.random() > 0.3 ? 'processed' : 'pending', // 70% processed, 30% pending
            processedAt: Math.random() > 0.3 ? new Date() : null,
          },
        });
        
        // If processed, create wallet transaction
        if (Math.random() > 0.3) {
          const transaction = await prisma.walletTransaction.create({
            data: {
              userId: upline.id,
              amount: rebateAmount,
              type: 'rebate',
              description: `Rebate from level ${level} purchase by ${user.name}`,
              status: 'completed',
            },
          });
          
          // Update rebate with wallet transaction ID
          await prisma.rebate.update({
            where: { id: purchase.id },
            data: { walletTransactionId: transaction.id },
          });
        }
      }
      
      currentUser = upline;
      level++;
    }
  }
  
  // Create rank advancements
  console.log('Creating rank advancements...');
  
  // For each regular user, create a rank advancement
  for (let i = 0; i < regularUsers.length; i++) {
    const user = regularUsers[i];
    const previousRankId = user.rankId - 1;
    const newRankId = user.rankId;
    
    await prisma.rankAdvancement.create({
      data: {
        userId: user.id,
        previousRankId,
        newRankId,
        personalSales: 5000,
        groupSales: 15000,
        directDownlineCount: 3,
        qualifiedDownlineCount: 1,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date in the last 30 days
      },
    });
  }
  
  console.log('Test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
