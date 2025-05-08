/**
 * Test Data Generator for MLM System
 * 
 * This script generates test data for testing the MLM system flow, including:
 * - Creating test users with upline relationships
 * - Creating test products including starter packages
 * - Setting up rebate configurations
 * - Creating test shareable links
 * 
 * Usage:
 * 1. Run with npm: npm run generate-test-data
 * 2. Or with ts-node: npx ts-node scripts/generate-test-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting test data generation...');

  // Clean up existing test data
  await cleanupTestData();

  // Create test ranks
  const ranks = await createRanks();

  // Create test users with upline relationships
  const users = await createUsers(ranks);

  // Create test products including starter packages
  const products = await createProducts();

  // Set up rebate configurations
  await setupRebateConfigurations(products);

  // Create test shareable links
  await createShareableLinks(users, products);

  console.log('Test data generation completed successfully!');
}

async function cleanupTestData() {
  console.log('Cleaning up existing test data...');

  // Only delete records marked as test data
  await prisma.linkClick.deleteMany({
    where: { testData: true }
  });

  await prisma.referralCommission.deleteMany({
    where: { testData: true }
  });

  await prisma.shareableLink.deleteMany({
    where: { testData: true }
  });

  await prisma.purchase.deleteMany({
    where: { testData: true }
  });

  await prisma.rebate.deleteMany({
    where: { testData: true }
  });

  await prisma.rebateConfig.deleteMany({
    where: { testData: true }
  });

  await prisma.walletTransaction.deleteMany({
    where: { testData: true }
  });

  await prisma.user.deleteMany({
    where: { 
      email: { 
        in: [
          'test.upline@example.com',
          'test.downline@example.com',
          'test.referred@example.com'
        ] 
      }
    }
  });

  console.log('Cleanup completed.');
}

async function createRanks() {
  console.log('Creating test ranks...');

  // Check if ranks already exist
  const existingRanks = await prisma.rank.findMany();
  
  if (existingRanks.length > 0) {
    console.log('Using existing ranks...');
    return existingRanks;
  }

  // Create basic ranks
  const ranks = await Promise.all([
    prisma.rank.create({
      data: {
        name: 'Distributor',
        level: 1,
        requirements: 'New member',
        benefits: 'Basic commission structure',
        icon: '🌱'
      }
    }),
    prisma.rank.create({
      data: {
        name: 'Silver',
        level: 2,
        requirements: 'Minimum 5 direct referrals',
        benefits: 'Enhanced commission rates',
        icon: '🥈'
      }
    }),
    prisma.rank.create({
      data: {
        name: 'Gold',
        level: 3,
        requirements: 'Minimum 10 direct referrals and 50 group volume',
        benefits: 'Premium commission rates and bonuses',
        icon: '🥇'
      }
    })
  ]);

  console.log(`Created ${ranks.length} ranks.`);
  return ranks;
}

async function createUsers(ranks: any[]) {
  console.log('Creating test users...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Password123', 10);

  // Create upline user
  const uplineUser = await prisma.user.upsert({
    where: { email: 'test.upline@example.com' },
    update: {},
    create: {
      name: 'Test Upline',
      email: 'test.upline@example.com',
      password: hashedPassword,
      phone: '09123456789',
      rankId: ranks[0].id,
      preferredPaymentMethod: 'gcash',
      paymentDetails: { gcashNumber: '09123456789' },
      testData: true,
      cleanupToken: 'test-cleanup-token'
    }
  });

  console.log(`Created upline user: ${uplineUser.name} (ID: ${uplineUser.id})`);

  // Create downline user
  const downlineUser = await prisma.user.upsert({
    where: { email: 'test.downline@example.com' },
    update: {},
    create: {
      name: 'Test Downline',
      email: 'test.downline@example.com',
      password: hashedPassword,
      phone: '09876543210',
      rankId: ranks[0].id,
      uplineId: uplineUser.id,
      preferredPaymentMethod: 'gcash',
      paymentDetails: { gcashNumber: '09876543210' },
      testData: true,
      cleanupToken: 'test-cleanup-token'
    }
  });

  console.log(`Created downline user: ${downlineUser.name} (ID: ${downlineUser.id})`);

  // Create wallet for users
  await prisma.wallet.upsert({
    where: { userId: uplineUser.id },
    update: { balance: 0 },
    create: { userId: uplineUser.id, balance: 0 }
  });

  await prisma.wallet.upsert({
    where: { userId: downlineUser.id },
    update: { balance: 0 },
    create: { userId: downlineUser.id, balance: 0 }
  });

  return { uplineUser, downlineUser };
}

async function createProducts() {
  console.log('Creating test products...');

  // Create starter package
  const starterPackage = await prisma.product.upsert({
    where: { sku: 'STARTER-PKG-001' },
    update: {
      name: 'Distributor Starter Package',
      description: 'Start your journey with our comprehensive starter package. Includes product samples and marketing materials.',
      price: 2999.00,
      srp: 3499.00,
      pv: 100,
      binaryValue: 100,
      inventory: 100,
      tags: 'starter,package,new member',
      isActive: true,
      referralCommissionType: 'percentage',
      referralCommissionValue: 10
    },
    create: {
      name: 'Distributor Starter Package',
      sku: 'STARTER-PKG-001',
      description: 'Start your journey with our comprehensive starter package. Includes product samples and marketing materials.',
      price: 2999.00,
      srp: 3499.00,
      pv: 100,
      binaryValue: 100,
      inventory: 100,
      tags: 'starter,package,new member',
      isActive: true,
      referralCommissionType: 'percentage',
      referralCommissionValue: 10
    }
  });

  console.log(`Created/Updated starter package: ${starterPackage.name}`);

  // Create regular product
  const regularProduct = await prisma.product.upsert({
    where: { sku: 'BIOGEN-EXTREME-001' },
    update: {
      name: 'Biogen Extreme',
      description: 'Our flagship health supplement for improved energy and vitality.',
      price: 1499.00,
      srp: 1799.00,
      pv: 50,
      binaryValue: 50,
      inventory: 200,
      tags: 'health,supplement,energy',
      isActive: true,
      referralCommissionType: 'percentage',
      referralCommissionValue: 5
    },
    create: {
      name: 'Biogen Extreme',
      sku: 'BIOGEN-EXTREME-001',
      description: 'Our flagship health supplement for improved energy and vitality.',
      price: 1499.00,
      srp: 1799.00,
      pv: 50,
      binaryValue: 50,
      inventory: 200,
      tags: 'health,supplement,energy',
      isActive: true,
      referralCommissionType: 'percentage',
      referralCommissionValue: 5
    }
  });

  console.log(`Created/Updated regular product: ${regularProduct.name}`);

  return { starterPackage, regularProduct };
}

async function setupRebateConfigurations(products: any) {
  console.log('Setting up rebate configurations...');

  // Create rebate configs for starter package
  const starterPackageRebateConfigs = await Promise.all([
    prisma.rebateConfig.upsert({
      where: {
        productId_level: {
          productId: products.starterPackage.id,
          level: 1
        }
      },
      update: {
        percentage: 10,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      },
      create: {
        productId: products.starterPackage.id,
        level: 1,
        percentage: 10,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      }
    }),
    prisma.rebateConfig.upsert({
      where: {
        productId_level: {
          productId: products.starterPackage.id,
          level: 2
        }
      },
      update: {
        percentage: 5,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      },
      create: {
        productId: products.starterPackage.id,
        level: 2,
        percentage: 5,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      }
    })
  ]);

  // Create rebate configs for regular product
  const regularProductRebateConfigs = await Promise.all([
    prisma.rebateConfig.upsert({
      where: {
        productId_level: {
          productId: products.regularProduct.id,
          level: 1
        }
      },
      update: {
        percentage: 5,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      },
      create: {
        productId: products.regularProduct.id,
        level: 1,
        percentage: 5,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      }
    }),
    prisma.rebateConfig.upsert({
      where: {
        productId_level: {
          productId: products.regularProduct.id,
          level: 2
        }
      },
      update: {
        percentage: 3,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      },
      create: {
        productId: products.regularProduct.id,
        level: 2,
        percentage: 3,
        testData: true,
        cleanupToken: 'test-cleanup-token'
      }
    })
  ]);

  console.log(`Created/Updated ${starterPackageRebateConfigs.length + regularProductRebateConfigs.length} rebate configurations.`);
}

async function createShareableLinks(users: any, products: any) {
  console.log('Creating shareable links...');

  // Create product shareable link for upline user
  const productShareableLink = await prisma.shareableLink.upsert({
    where: {
      userId_productId: {
        userId: users.uplineUser.id,
        productId: products.regularProduct.id
      }
    },
    update: {
      code: `test-${Date.now().toString(36)}`,
      type: 'product',
      title: 'Check out this amazing product!',
      description: 'I highly recommend this product for better health and energy.',
      isActive: true,
      testData: true,
      cleanupToken: 'test-cleanup-token'
    },
    create: {
      userId: users.uplineUser.id,
      productId: products.regularProduct.id,
      code: `test-${Date.now().toString(36)}`,
      type: 'product',
      title: 'Check out this amazing product!',
      description: 'I highly recommend this product for better health and energy.',
      isActive: true,
      testData: true,
      cleanupToken: 'test-cleanup-token'
    }
  });

  console.log(`Created shareable link: ${productShareableLink.code}`);
}

main()
  .catch((e) => {
    console.error('Error during test data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
