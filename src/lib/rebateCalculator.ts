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
  // Get the product's rebate configuration
  const rebateConfigs = await prisma.rebateConfig.findMany({
    where: { productId },
    orderBy: { level: "asc" },
  });

  // Get upline users
  const uplineUsers = await getUplineUsers(userId);

  // Calculate rebates for each upline user
  const rebates = [];

  for (const { user, level } of uplineUsers) {
    // Find the rebate config for this level
    const rebateConfig = rebateConfigs.find((config) => config.level === level);

    if (rebateConfig) {
      // Calculate rebate amount
      const rebateAmount = totalAmount * (rebateConfig.percentage / 100);

      // Create rebate record
      const rebate = await prisma.rebate.create({
        data: {
          purchaseId,
          receiverId: user.id,
          generatorId: userId,
          level,
          percentage: rebateConfig.percentage,
          amount: rebateAmount,
          status: "pending",
        },
      });

      rebates.push(rebate);
    }
  }

  return rebates;
}

// Function to process pending rebates
export async function processRebates() {
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
  });

  let processed = 0;
  let failed = 0;
  const results = {
    processed: 0,
    failed: 0,
    processedRebates: [] as any[],
    failedRebates: [] as any[]
  };

  for (const rebate of pendingRebates) {
    try {
      // Update user's wallet balance
      await prisma.user.update({
        where: { id: rebate.receiverId },
        data: { walletBalance: { increment: rebate.amount } },
      });

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
      const updatedRebate = await prisma.rebate.update({
        where: { id: rebate.id },
        data: {
          status: "processed",
          processedAt: new Date(),
          walletTransactionId: transaction.id
        },
      });

      // Send email notification
      if (rebate.receiver.email) {
        try {
          await sendEmail(
            rebate.receiver.email,
            'rebateReceived',
            {
              userName: rebate.receiver.name,
              amount: rebate.amount,
              generatorName: rebate.generator.name,
              level: rebate.level,
              productName: rebate.purchase.product.name
            }
          );
        } catch (emailError) {
          console.error(`Failed to send email for rebate ID ${rebate.id}:`, emailError);
          // We don't fail the rebate processing if just the email fails
        }
      }

      processed++;
      results.processedRebates.push({
        id: rebate.id,
        amount: rebate.amount,
        receiverId: rebate.receiverId,
        receiverName: rebate.receiver.name
      });
    } catch (error) {
      console.error(`Failed to process rebate ID ${rebate.id}:`, error);

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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  results.processed = processed;
  results.failed = failed;

  return results;
}
