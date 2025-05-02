/**
 * MLM Test User Generator
 *
 * This script generates test users with different roles and creates a realistic MLM structure.
 * Users are tagged with environment and test flags for easy management.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration options (can be overridden via command line arguments)
const DEFAULT_CONFIG = {
  environment: 'development', // 'development' or 'staging'
  userCount: 30,
  adminCount: 1,
  distributorCount: 20,
  rankedDistributorCount: 5,
  viewerCount: 4,
  maxLevels: 10,
  generatePurchases: true,
  generateRebates: true,
  outputJsonFile: path.resolve(__dirname, '../test-users.json'),
};

// Parse command line arguments
const args = process.argv.slice(2);
const config = { ...DEFAULT_CONFIG };

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];

  if (key === 'environment' && (value === 'development' || value === 'staging')) {
    config[key] = value;
  } else if (key === 'generatePurchases' || key === 'generateRebates') {
    config[key] = value === 'true';
  } else if (!isNaN(parseInt(value))) {
    config[key] = parseInt(value);
  } else {
    config[key] = value;
  }
}

// Sample data for generating realistic test users
const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
  'Thomas', 'Karen', 'Charles', 'Nancy', 'Christopher', 'Lisa', 'Daniel', 'Margaret',
  'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Ashley', 'Donald', 'Kimberly',
  'Steven', 'Emily', 'Paul', 'Donna', 'Andrew', 'Michelle', 'Joshua', 'Carol'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
  'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
  'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez',
  'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter'
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'yandex.com'
];

const ROLES = {
  ADMIN: 'admin',
  DISTRIBUTOR: 'distributor',
  RANKED_DISTRIBUTOR: 'ranked_distributor',
  VIEWER: 'viewer',
};

const RANKS = [
  { id: 1, name: 'Starter', level: 1 },
  { id: 2, name: 'Bronze', level: 2 },
  { id: 3, name: 'Silver', level: 3 },
  { id: 4, name: 'Gold', level: 4 },
  { id: 5, name: 'Platinum', level: 5 },
  { id: 6, name: 'Diamond', level: 6 },
];

const PRODUCTS = [
  { name: 'Basic Package', price: 99.99 },
  { name: 'Premium Package', price: 299.99 },
  { name: 'Elite Package', price: 599.99 },
];

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateName() {
  return `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
}

function generateEmail(name) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomNum = Math.floor(Math.random() * 1000);
  const domain = getRandomElement(EMAIL_DOMAINS);
  return `${cleanName}${randomNum}@${domain}`;
}

function generatePhone() {
  return `+1${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`;
}

// Main function to generate test users
async function generateTestUsers() {
  console.log(`Generating test users for ${config.environment} environment...`);

  try {
    // Check if ranks exist, create them if not
    const existingRanks = await prisma.rank.findMany();
    if (existingRanks.length === 0) {
      console.log('Creating ranks...');
      for (const rank of RANKS) {
        await prisma.rank.create({
          data: {
            name: rank.name,
            level: rank.level,
            description: `${rank.name} level rank`,
          },
        });
      }
    }

    // Check if products exist, create them if not
    const existingProducts = await prisma.product.findMany();
    if (existingProducts.length === 0) {
      console.log('Creating products...');
      for (const product of PRODUCTS) {
        const newProduct = await prisma.product.create({
          data: {
            name: product.name,
            description: `${product.name} description`,
            price: product.price,
            image: `/products/${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
          },
        });

        // Create rebate configs for each product
        for (let level = 1; level <= 10; level++) {
          const percentage = Math.max(20 - (level * 2), 0.5); // Decreasing percentage by level
          await prisma.rebateConfig.create({
            data: {
              productId: newProduct.id,
              level,
              percentage,
            },
          });
        }
      }
    }

    // Generate users
    const users = [];
    const password = await bcrypt.hash('password123', 10); // Same password for all test users

    // Generate admin users
    for (let i = 0; i < config.adminCount; i++) {
      const name = generateName();
      const user = {
        name,
        email: generateEmail(name),
        password,
        phone: generatePhone(),
        rank: { connect: { id: 6 } }, // Diamond rank for admins
        role: ROLES.ADMIN,
        isTest: true,
        environment: config.environment,
        keepForDev: true, // Keep admin users by default
      };
      users.push(user);
    }

    // Generate distributor users
    for (let i = 0; i < config.distributorCount; i++) {
      const name = generateName();
      const user = {
        name,
        email: generateEmail(name),
        password,
        phone: generatePhone(),
        rank: { connect: { id: 1 } }, // Starter rank for distributors
        role: ROLES.DISTRIBUTOR,
        isTest: true,
        environment: config.environment,
        keepForDev: Math.random() < 0.2, // 20% chance to keep
      };
      users.push(user);
    }

    // Generate ranked distributor users
    for (let i = 0; i < config.rankedDistributorCount; i++) {
      const name = generateName();
      const rankId = Math.floor(Math.random() * 5) + 2; // Random rank from Bronze to Diamond
      const user = {
        name,
        email: generateEmail(name),
        password,
        phone: generatePhone(),
        rank: { connect: { id: rankId } },
        role: ROLES.RANKED_DISTRIBUTOR,
        isTest: true,
        environment: config.environment,
        keepForDev: Math.random() < 0.5, // 50% chance to keep
      };
      users.push(user);
    }

    // Generate viewer users
    for (let i = 0; i < config.viewerCount; i++) {
      const name = generateName();
      const user = {
        name,
        email: generateEmail(name),
        password,
        phone: generatePhone(),
        rank: { connect: { id: 1 } }, // Starter rank for viewers
        role: ROLES.VIEWER,
        isTest: true,
        environment: config.environment,
        keepForDev: Math.random() < 0.3, // 30% chance to keep
      };
      users.push(user);
    }

    // Save users to database
    console.log(`Creating ${users.length} test users in database...`);
    const createdUsers = [];

    for (const userData of users) {
      const { role, isTest, environment, keepForDev, ...userDataForPrisma } = userData;

      // Since there's no metadata field in the schema, we'll use a workaround
      // We'll create the user without metadata and then manually add the role info
      const user = await prisma.user.create({
        data: {
          ...userDataForPrisma,
        },
      });

      // Store the metadata separately
      user.metadata = {
        role,
        isTest,
        environment,
        keepForDev,
      };

      createdUsers.push({
        ...user,
        role,
        isTest,
        environment,
        keepForDev,
      });
    }

    // Create MLM structure (assign uplines)
    console.log('Creating MLM structure...');

    // Sort users by role importance (admins first, then ranked distributors, then distributors)
    const sortedUsers = [...createdUsers].sort((a, b) => {
      if (a.role === ROLES.ADMIN) return -1;
      if (b.role === ROLES.ADMIN) return 1;
      if (a.role === ROLES.RANKED_DISTRIBUTOR && b.role !== ROLES.RANKED_DISTRIBUTOR) return -1;
      if (b.role === ROLES.RANKED_DISTRIBUTOR && a.role !== ROLES.RANKED_DISTRIBUTOR) return 1;
      if (a.role === ROLES.DISTRIBUTOR && b.role === ROLES.VIEWER) return -1;
      if (b.role === ROLES.DISTRIBUTOR && a.role === ROLES.VIEWER) return 1;
      return 0;
    });

    // Assign uplines to create a structured MLM tree
    // Skip the first user (top admin) as they have no upline
    for (let i = 1; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];

      // Determine the level in the MLM structure (1-10)
      const level = Math.min(Math.floor(i / 3) + 1, config.maxLevels);

      // Find a potential upline from higher levels
      const potentialUplines = sortedUsers.slice(0, i).filter(u =>
        u.role !== ROLES.VIEWER && // Viewers can't be uplines
        u.id !== user.id // Can't be your own upline
      );

      if (potentialUplines.length > 0) {
        const uplineIndex = Math.min(
          Math.floor(Math.random() * potentialUplines.length),
          potentialUplines.length - 1
        );
        const upline = potentialUplines[uplineIndex];

        // Update user with upline
        await prisma.user.update({
          where: { id: user.id },
          data: { upline: { connect: { id: upline.id } } },
        });

        // Update the user object
        user.uplineId = upline.id;
      }
    }

    // Generate purchases and rebates if enabled
    if (config.generatePurchases) {
      console.log('Generating purchase history...');

      // Only distributors and ranked distributors make purchases
      const purchasingUsers = sortedUsers.filter(
        user => user.role === ROLES.DISTRIBUTOR || user.role === ROLES.RANKED_DISTRIBUTOR
      );

      const products = await prisma.product.findMany({
        include: { rebateConfigs: true },
      });

      for (const user of purchasingUsers) {
        // Generate 1-5 purchases per user
        const purchaseCount = Math.floor(Math.random() * 5) + 1;

        for (let i = 0; i < purchaseCount; i++) {
          const product = getRandomElement(products);
          const quantity = Math.floor(Math.random() * 3) + 1;
          const totalAmount = product.price * quantity;

          // Create purchase
          const purchase = await prisma.purchase.create({
            data: {
              userId: user.id,
              productId: product.id,
              quantity,
              totalAmount,
            },
          });

          // Generate rebates if enabled
          if (config.generateRebates) {
            // Find all upline users
            let currentUser = user;
            let level = 1;

            while (currentUser.uplineId && level <= 10) {
              const upline = sortedUsers.find(u => u.id === currentUser.uplineId);
              if (!upline) break;

              // Find rebate config for this level
              const rebateConfig = product.rebateConfigs.find(rc => rc.level === level);

              if (rebateConfig) {
                const rebateAmount = totalAmount * (rebateConfig.percentage / 100);

                // Create rebate
                await prisma.rebate.create({
                  data: {
                    purchaseId: purchase.id,
                    receiverId: upline.id,
                    generatorId: user.id,
                    level,
                    percentage: rebateConfig.percentage,
                    amount: rebateAmount,
                    status: 'processed',
                    processedAt: new Date(),
                  },
                });

                // Update upline's wallet balance
                await prisma.user.update({
                  where: { id: upline.id },
                  data: { walletBalance: { increment: rebateAmount } },
                });

                // Create wallet transaction
                await prisma.walletTransaction.create({
                  data: {
                    userId: upline.id,
                    amount: rebateAmount,
                    type: 'rebate',
                    description: `Rebate from level ${level} purchase`,
                  },
                });
              }

              currentUser = upline;
              level++;
            }
          }
        }
      }
    }

    // Save user data to JSON file
    fs.writeFileSync(
      config.outputJsonFile,
      JSON.stringify({
        config,
        users: createdUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          rankId: u.rankId,
          uplineId: u.uplineId,
          isTest: u.isTest,
          environment: u.environment,
          keepForDev: u.keepForDev,
        }))
      }, null, 2)
    );

    console.log(`Successfully generated ${createdUsers.length} test users!`);
    console.log(`User data saved to ${config.outputJsonFile}`);

    return createdUsers;
  } catch (error) {
    console.error('Error generating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the generator if this script is executed directly
if (require.main === module) {
  generateTestUsers()
    .then(() => {
      console.log('Test user generation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { generateTestUsers };
