import { prisma } from "./prisma";
import { sendEmail } from "./emailService";

/**
 * Calculate rebates based on PV (Point Value) for a purchase
 * 
 * @param purchaseId The ID of the purchase
 * @param userId The ID of the user who made the purchase
 * @param productId The ID of the product purchased
 * @param totalAmount The total monetary amount of the purchase
 * @param totalPV The total PV (Point Value) of the purchase
 * @returns Result of the rebate calculation
 */
export async function calculatePvRebates(
  purchaseId: number,
  userId: number,
  productId: number,
  totalAmount: number,
  totalPV: number
) {
  try {
    // Get the product's rebate configuration
    const rebateConfigs = await prisma.rebateConfig.findMany({
      where: { productId },
      orderBy: { level: "asc" },
    });

    if (rebateConfigs.length === 0) {
      console.log(`No rebate configuration found for product ${productId}`);
      return {
        success: true,
        rebatesCreated: 0,
        message: "No rebate configuration found",
        rebates: []
      };
    }

    // Get upline users up to 6 levels (binary MLM max depth)
    const uplineUsers = await getUplineUsers(userId, 6);

    if (uplineUsers.length === 0) {
      console.log(`No upline found for user ${userId}`);
      return {
        success: true,
        rebatesCreated: 0,
        message: "No upline found",
        rebates: []
      };
    }

    // Get user ranks for rank-based multipliers
    const uplineIds = uplineUsers.map(u => u.user.id);
    const uplineRanks = await prisma.user.findMany({
      where: { id: { in: uplineIds } },
      include: { rank: true },
    });

    // Create a map of user IDs to their rank multipliers
    const rankMultipliers = uplineRanks.reduce((map, user) => {
      // Default multiplier is 1.0, but can be adjusted based on rank
      // Higher ranks could have higher multipliers
      const multiplier = user.rank.level >= 4 ? 1.2 : 1.0; // Example: 20% bonus for Gold and above
      map[user.id] = multiplier;
      return map;
    }, {} as Record<number, number>);

    // Prepare batch of rebates to create
    const rebatesToCreate = [];

    // Calculate rebates for each upline user
    for (const { user, level } of uplineUsers) {
      // Find the rebate config for this level
      const rebateConfig = rebateConfigs.find((config) => config.level === level);

      if (rebateConfig) {
        let rebateAmount = 0;
        let pvAmount = 0;
        const multiplier = rankMultipliers[user.id] || 1.0;

        // Calculate rebate amount based on reward type
        if (rebateConfig.rewardType === "fixed") {
          // For fixed amounts, we apply the rank multiplier to the fixed amount
          rebateAmount = rebateConfig.fixedAmount * multiplier;
          // PV-based amount is proportional to the PV
          pvAmount = totalPV * 0.01 * multiplier; // Example: 1% of PV
        } else {
          // For percentage-based rewards, calculate based on purchase amount and PV
          rebateAmount = totalAmount * (rebateConfig.percentage * multiplier) / 100;
          // PV-based amount is calculated using the same percentage
          pvAmount = totalPV * (rebateConfig.percentage * multiplier) / 100;
        }

        // Add to batch
        rebatesToCreate.push({
          purchaseId,
          receiverId: user.id,
          generatorId: userId,
          level,
          rewardType: rebateConfig.rewardType,
          percentage: rebateConfig.percentage,
          amount: rebateAmount,
          pvAmount,
          status: "pending",
        });
      }
    }

    // Create all rebates in a single transaction for better performance
    const rebates = await prisma.$transaction(
      rebatesToCreate.map(rebateData =>
        prisma.rebate.create({ data: rebateData })
      )
    );

    return {
      success: true,
      rebatesCreated: rebates.length,
      message: `Created ${rebates.length} rebate records`,
      rebates
    };
  } catch (error) {
    console.error("Error calculating PV rebates:", error);
    return {
      success: false,
      rebatesCreated: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rebates: []
    };
  }
}

/**
 * Function to get all upline users up to a specified number of levels
 * 
 * @param userId The ID of the user whose upline to fetch
 * @param maxLevels Maximum number of levels to fetch
 * @returns Array of upline users with their level
 */
export async function getUplineUsers(userId: number, maxLevels: number = 6) {
  const uplineUsers = [];
  let currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { upline: true },
  });

  let level = 1;
  while (currentUser?.upline && level <= maxLevels) {
    uplineUsers.push({
      user: currentUser.upline,
      level,
    });

    currentUser = await prisma.user.findUnique({
      where: { id: currentUser.upline.id },
      include: { upline: true },
    });

    level++;
  }

  return uplineUsers;
}

/**
 * Process pending rebates and update user wallet balances
 * 
 * @returns Result of the processing
 */
export async function processPvRebates() {
  try {
    // Get all pending rebates with related data
    const pendingRebates = await prisma.rebate.findMany({
      where: { status: "pending" },
      include: {
        receiver: true,
        generator: true,
        purchase: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        receiverId: 'asc' // Group by receiver for more efficient processing
      }
    });

    if (pendingRebates.length === 0) {
      return {
        success: true,
        processed: 0,
        failed: 0,
        message: "No pending rebates found",
        processedRebates: [],
        failedRebates: []
      };
    }

    let processed = 0;
    let failed = 0;
    const results = {
      processed: 0,
      failed: 0,
      processedRebates: [] as any[],
      failedRebates: [] as any[]
    };

    // Group rebates by receiver for batch processing
    const rebatesByReceiver = pendingRebates.reduce((groups, rebate) => {
      const receiverId = rebate.receiverId;
      if (!groups[receiverId]) {
        groups[receiverId] = [];
      }
      groups[receiverId].push(rebate);
      return groups;
    }, {} as Record<number, typeof pendingRebates>);

    // Process rebates in batches by receiver
    for (const [receiverId, receiverRebates] of Object.entries(rebatesByReceiver)) {
      try {
        // Calculate total amount for this receiver
        const totalAmount = receiverRebates.reduce((sum, rebate) => sum + rebate.amount, 0);
        const totalPvAmount = receiverRebates.reduce((sum, rebate) => sum + rebate.pvAmount, 0);

        // Update user's wallet balance in a single operation
        await prisma.user.update({
          where: { id: parseInt(receiverId) },
          data: { walletBalance: { increment: totalAmount } },
        });

        // Process each rebate in the batch
        for (const rebate of receiverRebates) {
          try {
            // Create wallet transaction
            const transaction = await prisma.walletTransaction.create({
              data: {
                userId: rebate.receiverId,
                amount: rebate.amount,
                type: "rebate",
                description: `Rebate from level ${rebate.level} purchase (PV: ${rebate.pvAmount.toFixed(2)})`,
                status: "completed",
              },
            });

            // Update rebate status
            await prisma.rebate.update({
              where: { id: rebate.id },
              data: {
                status: "processed",
                processedAt: new Date(),
                walletTransactionId: transaction.id
              },
            });

            // Queue email notification (don't wait for it)
            if (rebate.receiver.email) {
              sendEmail(
                rebate.receiver.email,
                'rebateReceived',
                {
                  userName: rebate.receiver.name,
                  amount: rebate.amount,
                  pvAmount: rebate.pvAmount,
                  generatorName: rebate.generator.name,
                  level: rebate.level,
                  productName: rebate.purchase.product.name
                }
              ).catch(emailError => {
                console.error(`Failed to send email for rebate ID ${rebate.id}:`, emailError);
              });
            }

            processed++;
            results.processedRebates.push({
              id: rebate.id,
              amount: rebate.amount,
              pvAmount: rebate.pvAmount,
              receiverId: rebate.receiverId,
              receiverName: rebate.receiver.name
            });
          } catch (error) {
            console.error(`Failed to process rebate ID ${rebate.id}:`, error);
            failed++;
            results.failedRebates.push({
              id: rebate.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        console.error(`Failed to process rebates for receiver ID ${receiverId}:`, error);
        failed += receiverRebates.length;
        results.failedRebates.push(...receiverRebates.map(rebate => ({
          id: rebate.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })));
      }
    }

    results.processed = processed;
    results.failed = failed;

    return {
      success: true,
      ...results,
      message: `Processed ${processed} rebates, failed ${failed} rebates`
    };
  } catch (error) {
    console.error("Error processing rebates:", error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      processedRebates: [],
      failedRebates: [],
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
