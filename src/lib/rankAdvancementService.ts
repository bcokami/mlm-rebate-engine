import { prisma } from "./prisma";
import { sendEmail } from "./emailService";
import { getDownlineLevelCounts, getEntireDownlineIds } from "./genealogyService";

/**
 * Interface for rank requirements
 */
interface RankRequirements {
  id: number;
  name: string;
  level: number;
  requiredPersonalSales: number;
  requiredGroupSales: number;
  requiredDirectDownline: number;
  requiredQualifiedDownline: number;
  qualifiedRankId: number | null;
}

/**
 * Check if a user qualifies for rank advancement
 * @param userId User ID to check
 * @returns Object with qualification status and next rank if qualified
 */
export async function checkRankAdvancementEligibility(userId: number) {
  try {
    // Get the user with their current rank
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rank: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get all ranks higher than the user's current rank
    const higherRanks = await prisma.rank.findMany({
      where: {
        level: {
          gt: user.rank.level,
        },
      },
      orderBy: {
        level: "asc",
      },
    });

    if (higherRanks.length === 0) {
      // User is already at the highest rank
      return {
        eligible: false,
        currentRank: user.rank,
        nextRank: null,
        message: "You are already at the highest rank.",
      };
    }

    // Get the next rank
    const nextRank = higherRanks[0];

    // Get the requirements for the next rank
    const rankRequirements = await prisma.rankRequirement.findUnique({
      where: { rankId: nextRank.id },
    });

    if (!rankRequirements) {
      throw new Error(`Requirements for rank ${nextRank.name} not found`);
    }

    // Check personal sales requirement
    const personalSales = await getPersonalSales(userId);
    const personalSalesQualified = personalSales >= rankRequirements.requiredPersonalSales;

    // Check group sales requirement
    const groupSales = await getGroupSales(userId);
    const groupSalesQualified = groupSales >= rankRequirements.requiredGroupSales;

    // Check direct downline requirement
    const directDownlineCount = await getDirectDownlineCount(userId);
    const directDownlineQualified = directDownlineCount >= rankRequirements.requiredDirectDownline;

    // Check qualified downline requirement
    let qualifiedDownlineCount = 0;
    let qualifiedDownlineQualified = true;

    if (rankRequirements.requiredQualifiedDownline > 0 && rankRequirements.qualifiedRankId) {
      qualifiedDownlineCount = await getQualifiedDownlineCount(userId, rankRequirements.qualifiedRankId);
      qualifiedDownlineQualified = qualifiedDownlineCount >= rankRequirements.requiredQualifiedDownline;
    }

    // Check if all requirements are met
    const isEligible = personalSalesQualified && groupSalesQualified && directDownlineQualified && qualifiedDownlineQualified;

    return {
      eligible: isEligible,
      currentRank: user.rank,
      nextRank,
      requirements: {
        personalSales: {
          required: rankRequirements.requiredPersonalSales,
          actual: personalSales,
          qualified: personalSalesQualified,
        },
        groupSales: {
          required: rankRequirements.requiredGroupSales,
          actual: groupSales,
          qualified: groupSalesQualified,
        },
        directDownline: {
          required: rankRequirements.requiredDirectDownline,
          actual: directDownlineCount,
          qualified: directDownlineQualified,
        },
        qualifiedDownline: {
          required: rankRequirements.requiredQualifiedDownline,
          actual: qualifiedDownlineCount,
          qualified: qualifiedDownlineQualified,
          qualifiedRankId: rankRequirements.qualifiedRankId,
        },
      },
      message: isEligible
        ? `Congratulations! You qualify for advancement to ${nextRank.name} rank.`
        : `You do not yet qualify for advancement to ${nextRank.name} rank.`,
    };
  } catch (error) {
    console.error("Error checking rank advancement eligibility:", error);
    throw error;
  }
}

/**
 * Process rank advancement for a user
 * @param userId User ID to process
 * @returns Object with advancement status
 */
export async function processRankAdvancement(userId: number) {
  try {
    // Check if the user is eligible for rank advancement
    const eligibility = await checkRankAdvancementEligibility(userId);

    if (!eligibility.eligible || !eligibility.nextRank) {
      return {
        success: false,
        message: eligibility.message,
        previousRank: eligibility.currentRank,
        newRank: null,
      };
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Update the user's rank
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        rankId: eligibility.nextRank.id,
      },
      include: {
        rank: true,
      },
    });

    // Create a rank advancement record
    await prisma.rankAdvancement.create({
      data: {
        userId,
        previousRankId: eligibility.currentRank.id,
        newRankId: eligibility.nextRank.id,
        personalSales: eligibility.requirements.personalSales.actual,
        groupSales: eligibility.requirements.groupSales.actual,
        directDownlineCount: eligibility.requirements.directDownline.actual,
        qualifiedDownlineCount: eligibility.requirements.qualifiedDownline.actual,
      },
    });

    // Send email notification
    if (user.email) {
      try {
        await sendEmail(
          user.email,
          'rankAdvancement',
          {
            userName: user.name,
            previousRank: eligibility.currentRank.name,
            newRank: eligibility.nextRank.name,
          }
        );
      } catch (emailError) {
        console.error(`Failed to send rank advancement email to user ${userId}:`, emailError);
        // We don't fail the rank advancement if just the email fails
      }
    }

    return {
      success: true,
      message: `Congratulations! You have been advanced to ${eligibility.nextRank.name} rank.`,
      previousRank: eligibility.currentRank,
      newRank: updatedUser.rank,
    };
  } catch (error) {
    console.error("Error processing rank advancement:", error);
    throw error;
  }
}

/**
 * Check and process rank advancements for all eligible users
 * @returns Object with advancement results
 */
export async function processAllRankAdvancements() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    });

    const results = {
      processed: 0,
      advanced: 0,
      failed: 0,
      advancedUsers: [] as any[],
      failedUsers: [] as any[],
    };

    // Check each user for rank advancement eligibility
    for (const user of users) {
      try {
        results.processed++;

        // Check if the user is eligible for rank advancement
        const eligibility = await checkRankAdvancementEligibility(user.id);

        if (eligibility.eligible && eligibility.nextRank) {
          // Process rank advancement
          const advancementResult = await processRankAdvancement(user.id);

          if (advancementResult.success) {
            results.advanced++;
            results.advancedUsers.push({
              userId: user.id,
              previousRank: advancementResult.previousRank.name,
              newRank: advancementResult.newRank.name,
            });
          } else {
            results.failed++;
            results.failedUsers.push({
              userId: user.id,
              reason: advancementResult.message,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing rank advancement for user ${user.id}:`, error);
        results.failed++;
        results.failedUsers.push({
          userId: user.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing all rank advancements:", error);
    throw error;
  }
}

// Helper functions

/**
 * Get a user's personal sales
 * @param userId User ID
 * @returns Total personal sales amount
 */
async function getPersonalSales(userId: number): Promise<number> {
  const result = await prisma.purchase.aggregate({
    where: {
      userId,
    },
    _sum: {
      totalAmount: true,
    },
  });

  return result._sum.totalAmount || 0;
}

/**
 * Get a user's group sales (personal + downline)
 * @param userId User ID
 * @returns Total group sales amount
 */
async function getGroupSales(userId: number): Promise<number> {
  // Get all downline user IDs
  const downlineIds = await getEntireDownlineIds(userId);
  
  // Add the user's own ID
  const allIds = [userId, ...downlineIds];

  // Get total sales for all users
  const result = await prisma.purchase.aggregate({
    where: {
      userId: {
        in: allIds,
      },
    },
    _sum: {
      totalAmount: true,
    },
  });

  return result._sum.totalAmount || 0;
}

/**
 * Get the count of direct downline users
 * @param userId User ID
 * @returns Count of direct downline users
 */
async function getDirectDownlineCount(userId: number): Promise<number> {
  return await prisma.user.count({
    where: {
      uplineId: userId,
    },
  });
}

/**
 * Get the count of qualified downline users (with a specific rank or higher)
 * @param userId User ID
 * @param qualifiedRankId Rank ID that qualifies
 * @returns Count of qualified downline users
 */
async function getQualifiedDownlineCount(userId: number, qualifiedRankId: number): Promise<number> {
  // Get the rank level for the qualified rank
  const qualifiedRank = await prisma.rank.findUnique({
    where: { id: qualifiedRankId },
    select: { level: true },
  });

  if (!qualifiedRank) {
    throw new Error(`Qualified rank with ID ${qualifiedRankId} not found`);
  }

  // Get all downline user IDs
  const downlineIds = await getEntireDownlineIds(userId);

  // Count downline users with the qualified rank or higher
  return await prisma.user.count({
    where: {
      id: {
        in: downlineIds,
      },
      rank: {
        level: {
          gte: qualifiedRank.level,
        },
      },
    },
  });
}
