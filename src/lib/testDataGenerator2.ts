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
    
    // Add metadata to status field to identify test data
    // Format: STATUS__TEST_DATA__TOKEN
    const metadataStatus = `completed__TEST_DATA__${cleanupToken}`;
    
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        productId: product.id,
        quantity,
        totalAmount,
        status: metadataStatus,
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
    
    // Add metadata to status field to identify test data
    const metadataStatus = `completed__TEST_DATA__${cleanupToken}`;
    
    const purchase = await prisma.purchase.create({
      data: {
        userId: downline.id,
        productId: product.id,
        quantity,
        totalAmount,
        status: metadataStatus,
      },
    });
    
    // Create rebate for the upline
    const rebateAmount = edgeCases && i % 4 === 0
      ? totalAmount * 0.5 // Unusually high rebate
      : totalAmount * 0.1; // Normal rebate (10%)
    
    // Add metadata to status field to identify test data
    const rebateMetadataStatus = `completed__TEST_DATA__${cleanupToken}`;
    
    const rebate = await prisma.rebate.create({
      data: {
        purchaseId: purchase.id,
        receiverId: userId,
        generatorId: downline.id,
        level: 1,
        percentage: edgeCases && i % 4 === 0 ? 50 : 10,
        amount: rebateAmount,
        status: rebateMetadataStatus,
      },
    });
    
    rebates.push(rebate);
    
    // Update wallet balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: { increment: rebateAmount },
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
  
  // Check if ShareableLink model exists
  try {
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
      
      // Add metadata to code to identify test data
      const metadataCode = `${code}__TEST_DATA__${cleanupToken}`;
      
      // Create link
      const link = await prisma.shareableLink.create({
        data: {
          userId,
          productId: product.id,
          code: metadataCode,
          type: "product",
          title: product.name,
          description: product.description,
          customImage: product.image,
          isActive: true,
          clickCount: faker.number.int({ min: 10, max: 100 }),
          conversionCount: faker.number.int({ min: 1, max: 10 }),
          totalRevenue: faker.number.float({ min: 1000, max: 10000, precision: 0.01 }),
          totalCommission: faker.number.float({ min: 100, max: 1000, precision: 0.01 }),
        },
      });
      
      links.push(link);
    }
  } catch (error) {
    console.error("Error creating referral links:", error);
    // ShareableLink model might not exist, just return empty array
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
    
    let totalDeleted = 0;
    
    // Find all users with the cleanup token in their name
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: `__TEST_DATA__${cleanupToken}`,
        },
      },
    });
    
    const userIds = users.map(user => user.id);
    
    // Delete rebates
    try {
      const deletedRebates = await prisma.rebate.deleteMany({
        where: {
          OR: [
            {
              receiverId: {
                in: userIds,
              },
            },
            {
              generatorId: {
                in: userIds,
              },
            },
            {
              status: {
                contains: `__TEST_DATA__${cleanupToken}`,
              },
            },
          ],
        },
      });
      
      totalDeleted += deletedRebates.count;
    } catch (error) {
      console.error("Error deleting rebates:", error);
    }
    
    // Delete purchases
    try {
      const deletedPurchases = await prisma.purchase.deleteMany({
        where: {
          OR: [
            {
              userId: {
                in: userIds,
              },
            },
            {
              status: {
                contains: `__TEST_DATA__${cleanupToken}`,
              },
            },
          ],
        },
      });
      
      totalDeleted += deletedPurchases.count;
    } catch (error) {
      console.error("Error deleting purchases:", error);
    }
    
    // Delete shareable links
    try {
      const deletedLinks = await prisma.shareableLink.deleteMany({
        where: {
          OR: [
            {
              userId: {
                in: userIds,
              },
            },
            {
              code: {
                contains: `__TEST_DATA__${cleanupToken}`,
              },
            },
          ],
        },
      });
      
      totalDeleted += deletedLinks.count;
    } catch (error) {
      console.error("Error deleting shareable links:", error);
      // ShareableLink model might not exist, ignore error
    }
    
    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        name: {
          contains: `__TEST_DATA__${cleanupToken}`,
        },
      },
    });
    
    totalDeleted += deletedUsers.count;
    
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
