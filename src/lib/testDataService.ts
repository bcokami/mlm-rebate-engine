import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { faker } from "@faker-js/faker/locale/en_PH";
import { Prisma } from "@prisma/client";

/**
 * Test data generation scenarios
 */
export enum TestScenario {
  NEW_MEMBER = "new_member",
  ESTABLISHED_MEMBER = "established_member",
  HIGH_PERFORMER = "high_performer",
  EDGE_CASES = "edge_cases",
}

/**
 * Test data generation options
 */
export interface TestDataOptions {
  scenario: TestScenario;
  count?: number; // Number of test users to create
  prefix?: string; // Prefix for test user emails
  cleanupToken?: string; // Token for cleanup validation
}

/**
 * Test data generation result
 */
export interface TestDataResult {
  success: boolean;
  message: string;
  users?: {
    id: number;
    email: string;
    name: string;
    password: string; // Plain text password for testing
    scenario: TestScenario;
  }[];
  stats?: {
    usersCreated: number;
    downlinesCreated: number;
    purchasesCreated: number;
    rebatesGenerated: number;
    referralLinksCreated: number;
  };
}

/**
 * Generate test data based on scenario
 */
export async function generateTestData(options: TestDataOptions): Promise<TestDataResult> {
  const {
    scenario,
    count = 1,
    prefix = "test",
    cleanupToken = "",
  } = options;

  try {
    // Create a cleanup token if not provided
    const actualCleanupToken = cleanupToken || `cleanup_${Date.now()}`;
    
    // Create test users based on scenario
    const users = [];
    let downlinesCreated = 0;
    let purchasesCreated = 0;
    let rebatesGenerated = 0;
    let referralLinksCreated = 0;
    
    for (let i = 0; i < count; i++) {
      // Create base user
      const email = `${prefix}_${scenario}_${i + 1}@test.com`;
      const name = faker.person.fullName();
      const password = "Test@123"; // Simple password for testing
      const hashedPassword = await hashPassword(password);
      
      // Create user with appropriate rank based on scenario
      const rankId = scenario === TestScenario.NEW_MEMBER ? 1 : // Distributor
                    scenario === TestScenario.ESTABLISHED_MEMBER ? 3 : // Gold
                    scenario === TestScenario.HIGH_PERFORMER ? 5 : // Diamond
                    Math.floor(Math.random() * 6) + 1; // Random rank for edge cases
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          rankId,
          isActive: true,
          testData: true, // Mark as test data
          testScenario: scenario,
          cleanupToken: actualCleanupToken,
        },
      });
      
      users.push({
        id: user.id,
        email,
        name,
        password, // Store plain text for testing
        scenario,
      });
      
      // Generate scenario-specific data
      switch (scenario) {
        case TestScenario.NEW_MEMBER:
          // New member has no downline, no purchases, no rebates
          // Create a wallet with zero balance
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: 0,
              testData: true,
              cleanupToken: actualCleanupToken,
            },
          });
          break;
          
        case TestScenario.ESTABLISHED_MEMBER:
          // Create wallet with moderate balance
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: faker.number.float({ min: 1000, max: 5000, precision: 0.01 }),
              testData: true,
              cleanupToken: actualCleanupToken,
            },
          });
          
          // Create downline (3-5 members)
          const downlineCount = faker.number.int({ min: 3, max: 5 });
          const downlines = await createDownline(user.id, downlineCount, 2, actualCleanupToken);
          downlinesCreated += downlines.length;
          
          // Create purchases (5-10)
          const purchaseCount = faker.number.int({ min: 5, max: 10 });
          const purchases = await createPurchases(user.id, purchaseCount, actualCleanupToken);
          purchasesCreated += purchases.length;
          
          // Create rebates based on downline purchases
          const rebates = await createRebates(user.id, downlines, actualCleanupToken);
          rebatesGenerated += rebates.length;
          
          // Create referral links (3-5)
          const linkCount = faker.number.int({ min: 3, max: 5 });
          const links = await createReferralLinks(user.id, linkCount, actualCleanupToken);
          referralLinksCreated += links.length;
          break;
          
        case TestScenario.HIGH_PERFORMER:
          // Create wallet with high balance
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: faker.number.float({ min: 50000, max: 200000, precision: 0.01 }),
              testData: true,
              cleanupToken: actualCleanupToken,
            },
          });
          
          // Create large downline (20-30 members with multiple levels)
          const largeDownlineCount = faker.number.int({ min: 20, max: 30 });
          const largeDownlines = await createDownline(user.id, largeDownlineCount, 6, actualCleanupToken);
          downlinesCreated += largeDownlines.length;
          
          // Create many purchases (20-30)
          const manyPurchaseCount = faker.number.int({ min: 20, max: 30 });
          const manyPurchases = await createPurchases(user.id, manyPurchaseCount, actualCleanupToken);
          purchasesCreated += manyPurchases.length;
          
          // Create many rebates based on downline purchases
          const manyRebates = await createRebates(user.id, largeDownlines, actualCleanupToken);
          rebatesGenerated += manyRebates.length;
          
          // Create many referral links (10-15)
          const manyLinkCount = faker.number.int({ min: 10, max: 15 });
          const manyLinks = await createReferralLinks(user.id, manyLinkCount, actualCleanupToken);
          referralLinksCreated += manyLinks.length;
          break;
          
        case TestScenario.EDGE_CASES:
          // Create wallet with extreme balance
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: faker.number.float({ min: 999999, max: 9999999, precision: 0.01 }),
              testData: true,
              cleanupToken: actualCleanupToken,
            },
          });
          
          // Create user with very long name
          await prisma.user.update({
            where: { id: user.id },
            data: {
              name: faker.lorem.words(10), // Very long name
            },
          });
          
          // Create downline with unusual structure
          const edgeDownlines = await createDownline(user.id, 5, 1, actualCleanupToken, true);
          downlinesCreated += edgeDownlines.length;
          
          // Create purchases with extreme values
          const edgePurchases = await createPurchases(user.id, 3, actualCleanupToken, true);
          purchasesCreated += edgePurchases.length;
          
          // Create rebates with extreme values
          const edgeRebates = await createRebates(user.id, edgeDownlines, actualCleanupToken, true);
          rebatesGenerated += edgeRebates.length;
          break;
      }
    }
    
    return {
      success: true,
      message: `Successfully generated test data for ${scenario} scenario`,
      users,
      stats: {
        usersCreated: users.length,
        downlinesCreated,
        purchasesCreated,
        rebatesGenerated,
        referralLinksCreated,
      },
    };
  } catch (error) {
    console.error("Error generating test data:", error);
    return {
      success: false,
      message: `Failed to generate test data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Create downline members for a user
 */
async function createDownline(
  userId: number,
  count: number,
  maxDepth: number,
  cleanupToken: string,
  edgeCases: boolean = false
): Promise<any[]> {
  const downlines = [];
  
  // Get user's rank
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rankId: true },
  });
  
  if (!user) return [];
  
  // Create downline members
  for (let i = 0; i < count; i++) {
    const position = i % 2 === 0 ? "left" : "right"; // Alternate left/right for binary structure
    const depth = Math.min(i % maxDepth + 1, maxDepth);
    
    // For edge cases, create some unusual names and ranks
    let name = faker.person.fullName();
    let rankId = Math.max(1, user.rankId - depth); // Lower rank than sponsor
    
    if (edgeCases && i % 3 === 0) {
      // Create some edge cases
      name = i % 2 === 0 
        ? faker.lorem.words(15) // Very long name
        : faker.lorem.word(2);  // Very short name
      
      rankId = i % 5 === 0 ? 6 : 1; // Either very high or very low rank
    }
    
    // Create downline member
    const downline = await prisma.user.create({
      data: {
        email: `downline_${userId}_${i}@test.com`,
        name,
        password: await hashPassword("Test@123"),
        rankId,
        isActive: true,
        testData: true,
        testScenario: "downline",
        cleanupToken,
        sponsor: {
          connect: { id: userId },
        },
        sponsorPosition: position,
      },
    });
    
    // Create wallet for downline
    await prisma.wallet.create({
      data: {
        userId: downline.id,
        balance: edgeCases && i % 4 === 0 
          ? faker.number.float({ min: 500000, max: 1000000, precision: 0.01 }) // Extreme balance
          : faker.number.float({ min: 100, max: 2000, precision: 0.01 }),      // Normal balance
        testData: true,
        cleanupToken,
      },
    });
    
    downlines.push(downline);
    
    // Recursively create deeper downline if needed
    if (depth < maxDepth && i % 3 === 0) {
      const subDownlineCount = Math.floor(count / 3);
      if (subDownlineCount > 0) {
        const subDownlines = await createDownline(
          downline.id,
          subDownlineCount,
          maxDepth - 1,
          cleanupToken,
          edgeCases
        );
        downlines.push(...subDownlines);
      }
    }
  }
  
  return downlines;
}

/**
 * Create purchases for a user
 */
async function createPurchases(
  userId: number,
  count: number,
  cleanupToken: string,
  edgeCases: boolean = false
): Promise<any[]> {
  const purchases = [];
  
  // Get products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 10, // Limit to 10 products
  });
  
  if (products.length === 0) return [];
  
  // Create purchases
  for (let i = 0; i < count; i++) {
    const product = products[i % products.length];
    const quantity = edgeCases && i % 3 === 0
      ? faker.number.int({ min: 50, max: 100 }) // Large quantity
      : faker.number.int({ min: 1, max: 5 });   // Normal quantity
    
    const totalAmount = product.price * quantity;
    
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalAmount,
        status: "completed",
        testData: true,
        cleanupToken,
      },
    });
    
    purchases.push(purchase);
  }
  
  return purchases;
}

/**
 * Create rebates based on downline purchases
 */
async function createRebates(
  userId: number,
  downlines: any[],
  cleanupToken: string,
  edgeCases: boolean = false
): Promise<any[]> {
  const rebates = [];
  
  // Get products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 10, // Limit to 10 products
  });
  
  if (products.length === 0 || downlines.length === 0) return [];
  
  // Create rebates for each downline
  for (let i = 0; i < downlines.length; i++) {
    const downline = downlines[i];
    const product = products[i % products.length];
    
    // Create a purchase for the downline
    const quantity = edgeCases && i % 3 === 0
      ? faker.number.int({ min: 50, max: 100 }) // Large quantity
      : faker.number.int({ min: 1, max: 5 });   // Normal quantity
    
    const totalAmount = product.price * quantity;
    
    const purchase = await prisma.purchase.create({
      data: {
        userId: downline.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalAmount,
        status: "completed",
        testData: true,
        cleanupToken,
      },
    });
    
    // Create rebate for the upline
    const rebateAmount = edgeCases && i % 4 === 0
      ? totalAmount * 0.5 // Unusually high rebate
      : totalAmount * 0.1; // Normal rebate (10%)
    
    const rebate = await prisma.rebate.create({
      data: {
        userId,
        generatorId: downline.id,
        purchaseId: purchase.id,
        amount: rebateAmount,
        level: 1,
        status: "completed",
        testData: true,
        cleanupToken,
      },
    });
    
    rebates.push(rebate);
    
    // Update wallet balance
    await prisma.wallet.updateMany({
      where: { userId },
      data: {
        balance: { increment: rebateAmount },
      },
    });
  }
  
  return rebates;
}

/**
 * Create referral links for a user
 */
async function createReferralLinks(
  userId: number,
  count: number,
  cleanupToken: string
): Promise<any[]> {
  const links = [];
  
  // Get products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 10, // Limit to 10 products
  });
  
  if (products.length === 0) return [];
  
  // Create referral links
  for (let i = 0; i < count; i++) {
    const product = products[i % products.length];
    
    // Generate a unique code
    const code = `ref_${userId}_${i}_${Date.now().toString(36)}`;
    
    // Create link
    const link = await prisma.shareableLink.create({
      data: {
        userId,
        productId: product.id,
        code,
        type: "product",
        title: product.name,
        description: product.description,
        customImage: product.image,
        isActive: true,
        clickCount: faker.number.int({ min: 10, max: 100 }),
        conversionCount: faker.number.int({ min: 1, max: 10 }),
        totalRevenue: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
        totalCommission: faker.number.float({ min: 100, max: 1000, precision: 0.01 }),
        testData: true,
        cleanupToken,
      },
    });
    
    links.push(link);
    
    // Create some clicks for this link
    const clickCount = faker.number.int({ min: 5, max: 20 });
    for (let j = 0; j < clickCount; j++) {
      await prisma.linkClick.create({
        data: {
          linkId: link.id,
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          referrer: faker.internet.url(),
          testData: true,
          cleanupToken,
        },
      });
    }
  }
  
  return links;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(cleanupToken: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    // Validate cleanup token
    if (!cleanupToken) {
      return {
        success: false,
        message: "Cleanup token is required",
        count: 0,
      };
    }
    
    // Delete test data in reverse order to avoid foreign key constraints
    
    // Delete link clicks
    const deletedLinkClicks = await prisma.linkClick.deleteMany({
      where: { cleanupToken },
    });
    
    // Delete shareable links
    const deletedLinks = await prisma.shareableLink.deleteMany({
      where: { cleanupToken },
    });
    
    // Delete rebates
    const deletedRebates = await prisma.rebate.deleteMany({
      where: { cleanupToken },
    });
    
    // Delete purchases
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: { cleanupToken },
    });
    
    // Delete wallets
    const deletedWallets = await prisma.wallet.deleteMany({
      where: { cleanupToken },
    });
    
    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { cleanupToken },
    });
    
    const totalDeleted = 
      deletedLinkClicks.count +
      deletedLinks.count +
      deletedRebates.count +
      deletedPurchases.count +
      deletedWallets.count +
      deletedUsers.count;
    
    return {
      success: true,
      message: `Successfully cleaned up test data with token: ${cleanupToken}`,
      count: totalDeleted,
    };
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    return {
      success: false,
      message: `Failed to clean up test data: ${error instanceof Error ? error.message : String(error)}`,
      count: 0,
    };
  }
}
