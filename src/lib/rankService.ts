import { prisma } from "./prisma";
import { sendEmail } from "./emailService";

// Define rank requirements
const rankRequirements = [
  { id: 1, name: "Starter", level: 1, directDownlineCount: 0, totalDownlineCount: 0, personalSalesAmount: 0 },
  { id: 2, name: "Bronze", level: 2, directDownlineCount: 3, totalDownlineCount: 5, personalSalesAmount: 500 },
  { id: 3, name: "Silver", level: 3, directDownlineCount: 5, totalDownlineCount: 15, personalSalesAmount: 1000 },
  { id: 4, name: "Gold", level: 4, directDownlineCount: 8, totalDownlineCount: 30, personalSalesAmount: 2000 },
  { id: 5, name: "Platinum", level: 5, directDownlineCount: 10, totalDownlineCount: 50, personalSalesAmount: 3000 },
  { id: 6, name: "Diamond", level: 6, directDownlineCount: 15, totalDownlineCount: 100, personalSalesAmount: 5000 },
];

// Define rank benefits
const rankBenefits = {
  "Starter": [
    "Basic rebate percentages",
    "Access to product shop",
    "Personal dashboard"
  ],
  "Bronze": [
    "5% higher rebate percentages",
    "Access to basic training materials",
    "Monthly team performance reports"
  ],
  "Silver": [
    "10% higher rebate percentages",
    "Access to advanced training materials",
    "Priority customer support"
  ],
  "Gold": [
    "15% higher rebate percentages",
    "Invitation to quarterly virtual events",
    "Personalized marketing materials"
  ],
  "Platinum": [
    "20% higher rebate percentages",
    "Invitation to annual in-person conference",
    "One-on-one coaching sessions"
  ],
  "Diamond": [
    "25% higher rebate percentages",
    "Leadership council membership",
    "Exclusive Diamond-only products and promotions",
    "Profit sharing opportunities"
  ]
};

// Function to check if a user qualifies for rank advancement
export async function checkRankAdvancement(userId: number) {
  try {
    // Get user with current rank
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rank: true,
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Get direct downline count
    const directDownlineCount = await prisma.user.count({
      where: { uplineId: userId },
    });

    // Get total downline (recursive query would be better but using a simpler approach for now)
    // This is a simplified approach and might not be efficient for large downlines
    const allDownline = await getEntireDownline(userId);
    const totalDownlineCount = allDownline.length;

    // Get personal sales amount (total purchases)
    const personalSales = await prisma.purchase.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
    });
    const personalSalesAmount = personalSales._sum.totalAmount || 0;

    // Find the highest rank the user qualifies for
    let highestQualifiedRank = rankRequirements[0]; // Start with Starter rank
    
    for (const rankReq of rankRequirements) {
      if (
        directDownlineCount >= rankReq.directDownlineCount &&
        totalDownlineCount >= rankReq.totalDownlineCount &&
        personalSalesAmount >= rankReq.personalSalesAmount
      ) {
        highestQualifiedRank = rankReq;
      } else {
        break; // Stop checking once we find a rank the user doesn't qualify for
      }
    }

    // If the user qualifies for a higher rank, update their rank
    if (highestQualifiedRank.level > user.rank.level) {
      const oldRank = user.rank;
      
      // Update user's rank
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { rankId: highestQualifiedRank.id },
        include: { rank: true },
      });

      // Send email notification
      if (user.email) {
        await sendEmail(
          user.email,
          'rankAdvancement',
          {
            userName: user.name,
            oldRank: oldRank.name,
            newRank: highestQualifiedRank.name,
            benefits: rankBenefits[highestQualifiedRank.name as keyof typeof rankBenefits],
          }
        );
      }

      return {
        advanced: true,
        oldRank,
        newRank: updatedUser.rank,
      };
    }

    return {
      advanced: false,
      currentRank: user.rank,
    };
  } catch (error) {
    console.error(`Error checking rank advancement for user ${userId}:`, error);
    throw error;
  }
}

// Helper function to get the entire downline of a user
async function getEntireDownline(userId: number): Promise<number[]> {
  const directDownline = await prisma.user.findMany({
    where: { uplineId: userId },
    select: { id: true },
  });

  const directDownlineIds = directDownline.map(user => user.id);
  
  if (directDownlineIds.length === 0) {
    return [];
  }

  const nestedDownlineIds: number[] = [];
  
  for (const downlineId of directDownlineIds) {
    const nestedIds = await getEntireDownline(downlineId);
    nestedDownlineIds.push(...nestedIds);
  }

  return [...directDownlineIds, ...nestedDownlineIds];
}

// Function to check rank advancement for all users
export async function checkAllUsersRankAdvancement() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    });

    const results = [];

    for (const user of users) {
      try {
        const result = await checkRankAdvancement(user.id);
        results.push({ userId: user.id, ...result });
      } catch (error) {
        console.error(`Error processing rank advancement for user ${user.id}:`, error);
        results.push({ userId: user.id, error: true, message: (error as Error).message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking rank advancement for all users:', error);
    throw error;
  }
}
