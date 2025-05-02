import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create ranks
  const ranks = [
    { name: "Starter", level: 1, description: "Entry level rank" },
    { name: "Bronze", level: 2, description: "Bronze level rank" },
    { name: "Silver", level: 3, description: "Silver level rank" },
    { name: "Gold", level: 4, description: "Gold level rank" },
    { name: "Platinum", level: 5, description: "Platinum level rank" },
    { name: "Diamond", level: 6, description: "Diamond level rank" },
  ];

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { level: rank.level },
      update: {},
      create: rank,
    });
  }

  console.log("Ranks created");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      rankId: 6, // Diamond rank
    },
  });

  console.log("Admin user created");

  // Create sample users with MLM structure
  const password = await bcrypt.hash("password123", 10);

  // Level 1 user (upline: admin)
  const user1 = await prisma.user.upsert({
    where: { email: "user1@example.com" },
    update: {},
    create: {
      name: "User One",
      email: "user1@example.com",
      password,
      rankId: 3, // Silver rank
      uplineId: admin.id,
    },
  });

  // Level 2 users (upline: user1)
  const user2 = await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {},
    create: {
      name: "User Two",
      email: "user2@example.com",
      password,
      rankId: 2, // Bronze rank
      uplineId: user1.id,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "user3@example.com" },
    update: {},
    create: {
      name: "User Three",
      email: "user3@example.com",
      password,
      rankId: 2, // Bronze rank
      uplineId: user1.id,
    },
  });

  // Level 3 users (upline: user2)
  const user4 = await prisma.user.upsert({
    where: { email: "user4@example.com" },
    update: {},
    create: {
      name: "User Four",
      email: "user4@example.com",
      password,
      rankId: 1, // Starter rank
      uplineId: user2.id,
    },
  });

  console.log("Sample users created");

  // Create sample products with rebate configs
  const products = [
    {
      name: "Basic Package",
      description: "Entry level product package",
      price: 99.99,
      image: "/products/basic.jpg",
      rebateConfigs: [
        { level: 1, percentage: 10 },
        { level: 2, percentage: 5 },
        { level: 3, percentage: 3 },
        { level: 4, percentage: 2 },
        { level: 5, percentage: 1 },
      ],
    },
    {
      name: "Premium Package",
      description: "Premium level product package",
      price: 299.99,
      image: "/products/premium.jpg",
      rebateConfigs: [
        { level: 1, percentage: 15 },
        { level: 2, percentage: 7 },
        { level: 3, percentage: 5 },
        { level: 4, percentage: 3 },
        { level: 5, percentage: 2 },
        { level: 6, percentage: 1 },
        { level: 7, percentage: 0.5 },
      ],
    },
    {
      name: "Elite Package",
      description: "Elite level product package",
      price: 599.99,
      image: "/products/elite.jpg",
      rebateConfigs: [
        { level: 1, percentage: 20 },
        { level: 2, percentage: 10 },
        { level: 3, percentage: 7 },
        { level: 4, percentage: 5 },
        { level: 5, percentage: 3 },
        { level: 6, percentage: 2 },
        { level: 7, percentage: 1 },
        { level: 8, percentage: 0.5 },
        { level: 9, percentage: 0.3 },
        { level: 10, percentage: 0.2 },
      ],
    },
  ];

  for (const product of products) {
    const { rebateConfigs, ...productData } = product;
    
    const createdProduct = await prisma.product.upsert({
      where: { id: 0 }, // This will always create a new product
      update: {},
      create: productData,
    });

    // Create rebate configs
    for (const config of rebateConfigs) {
      await prisma.rebateConfig.create({
        data: {
          productId: createdProduct.id,
          level: config.level,
          percentage: config.percentage,
        },
      });
    }
  }

  console.log("Sample products created");

  // Create sample purchases and rebates
  // User4 purchases Basic Package
  const purchase1 = await prisma.purchase.create({
    data: {
      userId: user4.id,
      productId: 1, // Basic Package
      quantity: 1,
      totalAmount: 99.99,
    },
  });

  // Calculate rebates for purchase1
  // Level 1 (user2) gets 10%
  await prisma.rebate.create({
    data: {
      purchaseId: purchase1.id,
      receiverId: user2.id,
      generatorId: user4.id,
      level: 1,
      percentage: 10,
      amount: 99.99 * 0.1,
      status: "processed",
      processedAt: new Date(),
    },
  });

  // Level 2 (user1) gets 5%
  await prisma.rebate.create({
    data: {
      purchaseId: purchase1.id,
      receiverId: user1.id,
      generatorId: user4.id,
      level: 2,
      percentage: 5,
      amount: 99.99 * 0.05,
      status: "processed",
      processedAt: new Date(),
    },
  });

  // Level 3 (admin) gets 3%
  await prisma.rebate.create({
    data: {
      purchaseId: purchase1.id,
      receiverId: admin.id,
      generatorId: user4.id,
      level: 3,
      percentage: 3,
      amount: 99.99 * 0.03,
      status: "processed",
      processedAt: new Date(),
    },
  });

  // Update wallet balances
  await prisma.user.update({
    where: { id: user2.id },
    data: { walletBalance: 99.99 * 0.1 },
  });

  await prisma.user.update({
    where: { id: user1.id },
    data: { walletBalance: 99.99 * 0.05 },
  });

  await prisma.user.update({
    where: { id: admin.id },
    data: { walletBalance: 99.99 * 0.03 },
  });

  // Create wallet transactions
  await prisma.walletTransaction.create({
    data: {
      userId: user2.id,
      amount: 99.99 * 0.1,
      type: "rebate",
      description: "Rebate from level 1 purchase",
    },
  });

  await prisma.walletTransaction.create({
    data: {
      userId: user1.id,
      amount: 99.99 * 0.05,
      type: "rebate",
      description: "Rebate from level 2 purchase",
    },
  });

  await prisma.walletTransaction.create({
    data: {
      userId: admin.id,
      amount: 99.99 * 0.03,
      type: "rebate",
      description: "Rebate from level 3 purchase",
    },
  });

  console.log("Sample purchases and rebates created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
