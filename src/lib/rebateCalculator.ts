import { prisma } from "./prisma";
import { sendEmail } from "./emailService";

// Function to get all upline users up to 10 levels
export async function getUplineUsers(userId: number, maxLevels: number = 10) {
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

// Function to calculate rebates for a purchase
export async function calculateRebates(
  purchaseId: number,
  userId: number,
  productId: number,
  totalAmount: number
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

    // Get upline users
    const uplineUsers = await getUplineUsers(userId);

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
        const multiplier = rankMultipliers[user.id] || 1.0;

        // Calculate rebate amount based on reward type
        if (rebateConfig.rewardType === "fixed") {
          // For fixed amounts, we apply the rank multiplier to the fixed amount
          rebateAmount = rebateConfig.fixedAmount * multiplier;
        } else {
          // For percentage-based rewards, calculate based on purchase amount
          rebateAmount = totalAmount * (rebateConfig.percentage * multiplier) / 100;
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
    console.error("Error calculating rebates:", error);
    return {
      success: false,
      rebatesCreated: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rebates: []
    };
  }
}

// Function to process pending rebates
export async function processRebates() {
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
                description: `Rebate from level ${rebate.level} purchase`,
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
              receiverId: rebate.receiverId,
              receiverName: rebate.receiver.name
            });
          } catch (individualError) {
            console.error(`Failed to process individual rebate ID ${rebate.id}:`, individualError);

            // Mark rebate as failed
            await prisma.rebate.update({
              where: { id: rebate.id },
              data: { status: "failed" },
            });

            failed++;
            results.failedRebates.push({
              id: rebate.id,
              amount: rebate.amount,
              receiverId: rebate.receiverId,
              receiverName: rebate.receiver.name,
              error: individualError instanceof Error ? individualError.message : 'Unknown error'
            });
          }
        }
      } catch (batchError) {
        console.error(`Failed to process batch for receiver ID ${receiverId}:`, batchError);

        // Mark all rebates in this batch as failed
        for (const rebate of receiverRebates) {
          await prisma.rebate.update({
            where: { id: rebate.id },
            data: { status: "failed" },
          });

          failed++;
          results.failedRebates.push({
            id: rebate.id,
            amount: rebate.amount,
            receiverId: rebate.receiverId,
            receiverName: rebate.receiver.name,
            error: batchError instanceof Error ? batchError.message : 'Unknown error'
          });
        }
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
