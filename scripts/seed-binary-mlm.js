const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration
const PASSWORD = 'password123';
const MAX_DEPTH = 6; // Maximum depth of the binary tree

// Helper function to create a user
async function createUser(name, email, rankId = 1, uplineId = null) {
  const password = await bcrypt.hash(PASSWORD, 10);
  
  return await prisma.user.create({
    data: {
      name,
      email,
      password,
      rankId,
      uplineId,
    },
  });
}

// Helper function to place a user in the binary tree
async function placeUserInBinaryTree(userId, uplineId, position) {
  // Update the upline user with the new downline
  await prisma.user.update({
    where: { id: uplineId },
    data: {
      [position === 'left' ? 'leftLegId' : 'rightLegId']: userId,
    },
  });

  // Update the user with the placement position
  return await prisma.user.update({
    where: { id: userId },
    data: {
      placementPosition: position,
    },
  });
}

// Helper function to create a product with PV
async function createProduct(name, price, pv, description = null) {
  return await prisma.product.create({
    data: {
      name,
      price,
      pv,
      description,
    },
  });
}

// Helper function to create commission rates
async function createCommissionRates() {
  // Direct referral bonus
  await prisma.commissionRate.create({
    data: {
      type: 'direct_referral',
      rewardType: 'fixed',
      fixedAmount: 10.0,
      description: 'Fixed bonus for each direct referral',
    },
  });

  // Level-based commissions
  const levelRates = [
    { level: 1, percentage: 1.0 },
    { level: 2, percentage: 0.75 },
    { level: 3, percentage: 0.5 },
    { level: 4, percentage: 0.5 },
    { level: 5, percentage: 0.5 },
    { level: 6, percentage: 0.5 },
  ];

  for (const rate of levelRates) {
    await prisma.commissionRate.create({
      data: {
        type: 'level_commission',
        level: rate.level,
        rewardType: 'percentage',
        percentage: rate.percentage,
        description: `Level ${rate.level} commission`,
      },
    });
  }

  // Group volume bonus
  await prisma.commissionRate.create({
    data: {
      type: 'group_volume',
      rewardType: 'percentage',
      percentage: 5.0,
      description: 'Group volume bonus based on weaker leg',
    },
  });
}

// Helper function to create a purchase
async function createPurchase(userId, productId, quantity = 1) {
  // Get the product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Calculate total amount and PV
  const totalAmount = product.price * quantity;
  const totalPV = product.pv * quantity;

  // Create the purchase
  return await prisma.purchase.create({
    data: {
      userId,
      productId,
      quantity,
      totalAmount,
      totalPV,
    },
  });
}

// Main function to seed the database
async function main() {
  try {
    console.log('Starting binary MLM seed...');

    // Create commission rates
    console.log('Creating commission rates...');
    await createCommissionRates();

    // Create products with PV
    console.log('Creating products with PV...');
    const products = [
      await createProduct('Basic Package', 99.99, 50, 'Entry level product'),
      await createProduct('Standard Package', 199.99, 100, 'Mid-tier product'),
      await createProduct('Premium Package', 499.99, 250, 'High-end product'),
      await createProduct('Elite Package', 999.99, 500, 'Top-tier product'),
    ];

    // Create rebate configs for each product
    console.log('Creating rebate configs...');
    for (const product of products) {
      // Create percentage-based rebate configs for levels 1-6
      for (let level = 1; level <= 6; level++) {
        let percentage;
        
        if (level === 1) percentage = 1.0;
        else if (level === 2) percentage = 0.75;
        else percentage = 0.5;
        
        await prisma.rebateConfig.create({
          data: {
            productId: product.id,
            level,
            rewardType: 'percentage',
            percentage,
          },
        });
      }
    }

    // Create users with binary structure
    console.log('Creating users with binary structure...');
    
    // Create admin user (root of the tree)
    const admin = await createUser('Admin User', 'admin@example.com', 6);
    console.log(`Created admin user: ${admin.name} (ID: ${admin.id})`);

    // Create first level users (left and right legs of admin)
    const user1 = await createUser('User One', 'user1@example.com', 3, admin.id);
    await placeUserInBinaryTree(user1.id, admin.id, 'left');
    console.log(`Created user: ${user1.name} (ID: ${user1.id}) - Left leg of Admin`);

    const user2 = await createUser('User Two', 'user2@example.com', 3, admin.id);
    await placeUserInBinaryTree(user2.id, admin.id, 'right');
    console.log(`Created user: ${user2.name} (ID: ${user2.id}) - Right leg of Admin`);

    // Create second level users
    const user3 = await createUser('User Three', 'user3@example.com', 2, user1.id);
    await placeUserInBinaryTree(user3.id, user1.id, 'left');
    console.log(`Created user: ${user3.name} (ID: ${user3.id}) - Left leg of User One`);

    const user4 = await createUser('User Four', 'user4@example.com', 2, user1.id);
    await placeUserInBinaryTree(user4.id, user1.id, 'right');
    console.log(`Created user: ${user4.name} (ID: ${user4.id}) - Right leg of User One`);

    const user5 = await createUser('User Five', 'user5@example.com', 2, user2.id);
    await placeUserInBinaryTree(user5.id, user2.id, 'left');
    console.log(`Created user: ${user5.name} (ID: ${user5.id}) - Left leg of User Two`);

    const user6 = await createUser('User Six', 'user6@example.com', 2, user2.id);
    await placeUserInBinaryTree(user6.id, user2.id, 'right');
    console.log(`Created user: ${user6.name} (ID: ${user6.id}) - Right leg of User Two`);

    // Create third level users (just a few examples)
    const user7 = await createUser('User Seven', 'user7@example.com', 1, user3.id);
    await placeUserInBinaryTree(user7.id, user3.id, 'left');
    console.log(`Created user: ${user7.name} (ID: ${user7.id}) - Left leg of User Three`);

    const user8 = await createUser('User Eight', 'user8@example.com', 1, user3.id);
    await placeUserInBinaryTree(user8.id, user3.id, 'right');
    console.log(`Created user: ${user8.name} (ID: ${user8.id}) - Right leg of User Three`);

    const user9 = await createUser('User Nine', 'user9@example.com', 1, user5.id);
    await placeUserInBinaryTree(user9.id, user5.id, 'left');
    console.log(`Created user: ${user9.name} (ID: ${user9.id}) - Left leg of User Five`);

    const user10 = await createUser('User Ten', 'user10@example.com', 1, user6.id);
    await placeUserInBinaryTree(user10.id, user6.id, 'right');
    console.log(`Created user: ${user10.name} (ID: ${user10.id}) - Right leg of User Six`);

    // Create purchases for April (for simulation)
    console.log('Creating purchases for April...');
    
    // April 2023
    const april2023 = {
      year: 2023,
      month: 4,
      startDate: new Date(2023, 3, 1), // April 1, 2023
      endDate: new Date(2023, 3, 30), // April 30, 2023
    };

    // Create purchases for each user
    const users = [admin, user1, user2, user3, user4, user5, user6, user7, user8, user9, user10];
    
    for (const user of users) {
      // Each user makes 1-3 purchases of random products
      const numPurchases = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numPurchases; i++) {
        // Select a random product
        const product = products[Math.floor(Math.random() * products.length)];
        
        // Create the purchase with a random date in April
        const purchaseDate = new Date(
          april2023.year,
          april2023.month - 1,
          Math.floor(Math.random() * 30) + 1
        );
        
        const purchase = await createPurchase(user.id, product.id);
        
        // Update the purchase date
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            createdAt: purchaseDate,
          },
        });
        
        console.log(`Created purchase for ${user.name}: ${product.name} (PV: ${product.pv})`);
      }
    }

    console.log('Binary MLM seed completed successfully!');
  } catch (error) {
    console.error('Error seeding binary MLM data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
