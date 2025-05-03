const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Configuration
const LEVELS_DEPTH = 5; // How many levels deep to create
const USERS_PER_LEVEL = [3, 3, 2, 2, 1]; // How many users to create at each level
const PASSWORD = 'Network@123';

async function main() {
  try {
    console.log('Starting complex genealogy generation...');

    // Check if ranks exist
    const ranksCount = await prisma.rank.count();
    if (ranksCount === 0) {
      throw new Error('Ranks not found. Please run add-admin-user.js first.');
    }

    // Get the admin user to set as the root
    const rootUser = await prisma.user.findFirst({
      where: { email: 'superadmin@extremelife.ph' },
    });

    if (!rootUser) {
      throw new Error('Root user (superadmin@extremelife.ph) not found. Please run add-admin-user.js first.');
    }

    console.log(`Using ${rootUser.name} (${rootUser.email}) as the root user.`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    // Get all ranks
    const ranks = await prisma.rank.findMany({
      orderBy: { level: 'asc' },
    });

    // Create users level by level
    let currentLevelUsers = [rootUser];
    let totalUsersCreated = 0;

    for (let level = 0; level < LEVELS_DEPTH; level++) {
      console.log(`\nGenerating users for level ${level + 1}...`);

      const nextLevelUsers = [];
      const usersToCreateAtThisLevel = USERS_PER_LEVEL[level] || 1;

      for (const uplineUser of currentLevelUsers) {
        // Determine rank for this level's users (decrease as we go deeper)
        const rankIndex = Math.max(0, ranks.length - 1 - level);
        const rank = ranks[rankIndex];

        console.log(`Creating ${usersToCreateAtThisLevel} users under ${uplineUser.name} with rank ${rank.name}`);

        for (let i = 0; i < usersToCreateAtThisLevel; i++) {
          const userNumber = totalUsersCreated + 1;
          const email = `network-new${userNumber}@extremelife.ph`;
          const name = `Network New ${userNumber}`;

          const newUser = await prisma.user.create({
            data: {
              email,
              name,
              password: hashedPassword,
              rankId: rank.id,
              uplineId: uplineUser.id,
              walletBalance: 1000 * (LEVELS_DEPTH - level), // More balance for higher levels
            },
          });

          console.log(`Created ${newUser.name} (${newUser.email}) with rank ${rank.name}`);
          nextLevelUsers.push(newUser);
          totalUsersCreated++;
        }
      }

      currentLevelUsers = nextLevelUsers;
      if (nextLevelUsers.length === 0) break;
    }

    console.log('\nComplex genealogy generation completed!');
    console.log(`Total users created: ${totalUsersCreated}`);
    console.log(`Password for all users: ${PASSWORD}`);

    // Generate some purchases and rebates
    console.log('\nGenerating purchases and rebates...');

    // Get all products
    const products = await prisma.product.findMany({
      where: { isActive: true },
    });

    if (products.length === 0) {
      console.log('No products found. Skipping purchase generation.');
    } else {
      // Get all users except the root
      const allUsers = await prisma.user.findMany({
        where: {
          NOT: { id: rootUser.id },
        },
      });

      let purchasesCreated = 0;
      let rebatesCreated = 0;

      for (const user of allUsers) {
        // Each user makes 1-3 purchases
        const purchaseCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < purchaseCount; i++) {
          // Select a random product
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const totalAmount = product.price * quantity;

          const purchase = await prisma.purchase.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity,
              totalAmount,
              status: 'completed',
            },
          });

          purchasesCreated++;

          // Generate rebates for this purchase
          let currentUser = user;
          let level = 1;

          while (currentUser.uplineId && level <= 10) {
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
              // Calculate rebate amount based on percentage
              const rebateAmount = (totalAmount * rebateConfig.percentage) / 100;

              // Create rebate
              await prisma.rebate.create({
                data: {
                  purchaseId: purchase.id,
                  receiverId: upline.id,
                  generatorId: user.id,
                  level,
                  // rewardType field doesn't exist in the database schema
                  percentage: rebateConfig.percentage,
                  amount: rebateAmount,
                  status: Math.random() > 0.3 ? 'processed' : 'pending',
                  processedAt: Math.random() > 0.3 ? new Date() : null,
                },
              });

              rebatesCreated++;
            }

            currentUser = upline;
            level++;
          }
        }
      }

      console.log(`Created ${purchasesCreated} purchases and ${rebatesCreated} rebates.`);
    }

  } catch (error) {
    console.error('Error generating complex genealogy:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\nGenealogy generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Generation failed:', error);
    process.exit(1);
  });
