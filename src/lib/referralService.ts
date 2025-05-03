import { prisma } from "./prisma";
import { sendEmail } from "./emailService";

/**
 * Process a referral reward when a new user is referred
 * @param referrerId The ID of the user who referred the new user
 * @param newUserId The ID of the newly registered user
 * @returns Object with the result of the referral processing
 */
export async function processReferralReward(referrerId: number, newUserId: number) {
  try {
    // Get the referrer
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        rank: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    if (!referrer) {
      return {
        success: false,
        message: `Referrer with ID ${referrerId} not found`,
      };
    }

    // Get the new user
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!newUser) {
      return {
        success: false,
        message: `New user with ID ${newUserId} not found`,
      };
    }

    // Get active referral rewards
    const referralRewards = await prisma.referralReward.findMany({
      where: { active: true },
      orderBy: { amount: "desc" }, // Get highest reward first
    });

    if (referralRewards.length === 0) {
      return {
        success: false,
        message: "No active referral rewards found",
      };
    }

    // Select the appropriate reward (could be based on referrer's rank or other criteria)
    // For simplicity, we'll use the first active reward
    const reward = referralRewards[0];

    // Calculate reward amount
    let rewardAmount = 0;
    if (reward.rewardType === "fixed") {
      rewardAmount = reward.amount;
    } else {
      // For percentage-based rewards, we might calculate based on a standard value
      // or the new user's first purchase, etc.
      // For now, we'll use a default value of 100
      const baseValue = 100;
      rewardAmount = baseValue * (reward.percentage / 100);
    }

    // Create wallet transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId: referrerId,
        amount: rewardAmount,
        type: "referral",
        description: `Referral reward for inviting ${newUser.name}`,
        status: "completed",
      },
    });

    // Update referrer's wallet balance
    await prisma.user.update({
      where: { id: referrerId },
      data: { walletBalance: { increment: rewardAmount } },
    });

    // Send email notification
    if (referrer.email) {
      try {
        await sendEmail(
          referrer.email,
          'referralReward',
          {
            userName: referrer.name,
            amount: rewardAmount,
            referredName: newUser.name,
          }
        );
      } catch (emailError) {
        console.error(`Failed to send referral reward email to user ${referrerId}:`, emailError);
        // We don't fail the reward processing if just the email fails
      }
    }

    return {
      success: true,
      message: `Referral reward of ${rewardAmount} processed successfully`,
      rewardAmount,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Error processing referral reward:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Process a bonus reward based on a specific trigger
 * @param userId The ID of the user to receive the bonus
 * @param triggerType The type of trigger (e.g., "rank_advancement", "sales_milestone")
 * @param triggerData Additional data related to the trigger
 * @returns Object with the result of the bonus processing
 */
export async function processBonusReward(
  userId: number,
  triggerType: string,
  triggerData: any
) {
  try {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        rank: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: `User with ID ${userId} not found`,
      };
    }

    // Get active bonus rewards for this trigger type
    const bonusRewards = await prisma.bonusReward.findMany({
      where: {
        active: true,
        triggerType,
      },
    });

    if (bonusRewards.length === 0) {
      return {
        success: false,
        message: `No active bonus rewards found for trigger type ${triggerType}`,
      };
    }

    // Find the applicable bonus reward
    // This could involve complex logic based on the trigger data
    const applicableRewards = bonusRewards.filter((reward) => {
      if (!reward.triggerValue) return true;

      try {
        const triggerConditions = JSON.parse(reward.triggerValue);

        // Check if the trigger conditions match the trigger data
        // This is a simplified example - real implementation would be more complex
        switch (triggerType) {
          case "rank_advancement":
            return (
              (!triggerConditions.rankId || triggerConditions.rankId === triggerData.newRankId) &&
              (!triggerConditions.minLevel || user.rank.level >= triggerConditions.minLevel)
            );
          case "sales_milestone":
            return (
              (!triggerConditions.minAmount || triggerData.amount >= triggerConditions.minAmount) &&
              (!triggerConditions.minRankLevel || user.rank.level >= triggerConditions.minRankLevel)
            );
          default:
            return false;
        }
      } catch (error) {
        console.error(`Error parsing trigger value for bonus reward ${reward.id}:`, error);
        return false;
      }
    });

    if (applicableRewards.length === 0) {
      return {
        success: false,
        message: "No applicable bonus rewards found for the given trigger data",
      };
    }

    // Select the highest reward
    const reward = applicableRewards.reduce((highest, current) => {
      const highestAmount = highest.rewardType === "fixed" ? highest.amount : highest.percentage;
      const currentAmount = current.rewardType === "fixed" ? current.amount : current.percentage;
      return currentAmount > highestAmount ? current : highest;
    }, applicableRewards[0]);

    // Calculate reward amount
    let rewardAmount = 0;
    if (reward.rewardType === "fixed") {
      rewardAmount = reward.amount;
    } else {
      // For percentage-based rewards, calculate based on a value from the trigger data
      const baseValue = triggerData.amount || 100;
      rewardAmount = baseValue * (reward.percentage / 100);
    }

    // Create wallet transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        amount: rewardAmount,
        type: "bonus",
        description: `Bonus reward: ${reward.name}`,
        status: "completed",
      },
    });

    // Update user's wallet balance
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: rewardAmount } },
    });

    // Send email notification
    if (user.email) {
      try {
        await sendEmail(
          user.email,
          'bonusReward',
          {
            userName: user.name,
            amount: rewardAmount,
            bonusName: reward.name,
            bonusDescription: reward.description || "",
          }
        );
      } catch (emailError) {
        console.error(`Failed to send bonus reward email to user ${userId}:`, emailError);
        // We don't fail the reward processing if just the email fails
      }
    }

    return {
      success: true,
      message: `Bonus reward of ${rewardAmount} processed successfully`,
      rewardAmount,
      rewardName: reward.name,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Error processing bonus reward:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
