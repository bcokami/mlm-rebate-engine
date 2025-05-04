import { prisma } from "./prisma";
import { getMlmConfiguration, calculatePerformanceBonus } from "./mlmConfigService";

/**
 * Interface for unilevel MLM user data
 */
export interface UnilevelMlmUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  uplineId: number | null;
  walletBalance: number;
  rank: {
    id: number;
    name: string;
    level: number;
  };
}

/**
 * Interface for unilevel tree node
 */
export interface UnilevelTreeNode {
  user: UnilevelMlmUser;
  level: number;
  children: UnilevelTreeNode[];
}

/**
 * Interface for commission calculation result
 */
export interface UnilevelCommissionResult {
  directReferralBonus: number;
  levelCommissions: number;
  performanceBonus: number;
  totalCommission: number;
  breakdown: {
    directReferral: {
      amount: number;
      details: any[];
    };
    levelCommissions: {
      amount: number;
      byLevel: Record<number, number>;
      details: any[];
    };
    performanceBonus: {
      amount: number;
      details: any;
    };
  };
}

/**
 * Build a unilevel tree structure for a user
 * 
 * @param userId The ID of the root user
 * @param maxDepth Maximum depth of the tree
 * @returns Unilevel tree structure
 */
export async function buildUnilevelTree(
  userId: number,
  maxDepth: number = 6
): Promise<UnilevelTreeNode> {
  // Get the root user
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      rank: true,
    },
  });

  if (!rootUser) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Build the tree recursively
  return await buildUnilevelTreeRecursive(rootUser as UnilevelMlmUser, 0, maxDepth);
}

/**
 * Recursively build a unilevel tree
 * 
 * @param user The current user
 * @param currentDepth Current depth in the tree
 * @param maxDepth Maximum depth to build
 * @returns Unilevel tree node
 */
async function buildUnilevelTreeRecursive(
  user: UnilevelMlmUser,
  currentDepth: number,
  maxDepth: number
): Promise<UnilevelTreeNode> {
  if (currentDepth > maxDepth) {
    return {
      user,
      level: currentDepth,
      children: [],
    };
  }

  // Create the current node
  const node: UnilevelTreeNode = {
    user,
    level: currentDepth,
    children: [],
  };

  // Get direct downline users
  const directDownline = await prisma.user.findMany({
    where: { uplineId: user.id },
    include: {
      rank: true,
    },
  });

  // Recursively build the tree for each downline
  if (directDownline.length > 0) {
    for (const downlineUser of directDownline) {
      const childNode = await buildUnilevelTreeRecursive(
        downlineUser as UnilevelMlmUser,
        currentDepth + 1,
        maxDepth
      );
      node.children.push(childNode);
    }
  }

  return node;
}

/**
 * Get all users in a user's downline up to a specified level
 * 
 * @param userId The ID of the user
 * @param maxLevel Maximum level to retrieve
 * @returns Array of users with their level
 */
export async function getDownlineByLevel(
  userId: number,
  maxLevel: number = 6
): Promise<{ user: UnilevelMlmUser; level: number }[]> {
  // Build the unilevel tree
  const tree = await buildUnilevelTree(userId, maxLevel);
  
  // Flatten the tree into an array
  const result: { user: UnilevelMlmUser; level: number }[] = [];
  
  // Helper function to traverse the tree
  function traverseTree(node: UnilevelTreeNode) {
    result.push({
      user: node.user,
      level: node.level,
    });
    
    for (const child of node.children) {
      traverseTree(child);
    }
  }
  
  // Start traversal from the root
  traverseTree(tree);
  
  return result;
}

/**
 * Calculate personal PV for a user
 * 
 * @param userId The ID of the user
 * @param startDate Start date
 * @param endDate End date
 * @returns Personal PV
 */
export async function calculatePersonalPV(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    select: {
      totalPV: true,
    },
  });
  
  return purchases.reduce((sum, purchase) => sum + purchase.totalPV, 0);
}

/**
 * Calculate total PV for a user's downline
 * 
 * @param userId The ID of the user
 * @param startDate Start date for the calculation period
 * @param endDate End date for the calculation period
 * @returns Total PV
 */
export async function calculateGroupPV(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Get all users in the downline
  const downline = await getDownlineByLevel(userId);
  
  // Get all user IDs
  const userIds = downline.map(d => d.user.id);
  
  // Get all purchases for these users in the date range
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: { in: userIds },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'completed',
    },
    select: {
      totalPV: true,
    },
  });
  
  // Sum up the PV
  return purchases.reduce((sum, purchase) => sum + purchase.totalPV, 0);
}

/**
 * Calculate commissions for a user based on their downline's activity
 * 
 * @param userId The ID of the user
 * @param startDate Start date for the calculation period
 * @param endDate End date for the calculation period
 * @returns Commission calculation results
 */
export async function calculateCommissions(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<UnilevelCommissionResult> {
  // Get the MLM configuration
  const config = await getMlmConfiguration();
  
  // Get the commission rates
  const commissionRates = await prisma.commissionRate.findMany({
    where: {
      active: true,
    },
  });

  // Group commission rates by type
  const directReferralRate = commissionRates.find(r => r.type === 'direct_referral');
  const levelRates = commissionRates
    .filter(r => r.type === 'level_commission')
    .reduce((acc, rate) => {
      if (rate.level !== null) {
        acc[rate.level] = rate;
      }
      return acc;
    }, {} as Record<number, typeof commissionRates[0]>);

  // Initialize result
  const result: UnilevelCommissionResult = {
    directReferralBonus: 0,
    levelCommissions: 0,
    performanceBonus: 0,
    totalCommission: 0,
    breakdown: {
      directReferral: {
        amount: 0,
        details: [],
      },
      levelCommissions: {
        amount: 0,
        byLevel: {},
        details: [],
      },
      performanceBonus: {
        amount: 0,
        details: null,
      },
    },
  };

  // 1. Calculate direct referral bonus
  const directReferrals = await prisma.user.findMany({
    where: {
      uplineId: userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (directReferralRate) {
    const bonusPerReferral = directReferralRate.rewardType === 'fixed'
      ? directReferralRate.fixedAmount
      : 0; // For percentage-based, we would need a base value

    result.directReferralBonus = bonusPerReferral * directReferrals.length;
    result.breakdown.directReferral = {
      amount: result.directReferralBonus,
      details: directReferrals.map(user => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.createdAt,
        bonus: bonusPerReferral,
      })),
    };
  }

  // 2. Calculate level-based commissions
  // Get all downline users with their levels
  const downlineByLevel = await getDownlineByLevel(userId, config.unilevelMaxDepth);
  
  // Group users by level
  const usersByLevel = downlineByLevel.reduce((acc, item) => {
    const level = item.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(item.user);
    return acc;
  }, {} as Record<number, UnilevelMlmUser[]>);

  // Calculate commissions for each level
  let totalLevelCommissions = 0;
  const levelBreakdown: Record<number, number> = {};
  const levelDetails: any[] = [];

  for (let level = 1; level <= config.unilevelMaxDepth; level++) {
    const usersAtLevel = usersByLevel[level] || [];
    const levelRate = levelRates[level];
    
    if (levelRate && usersAtLevel.length > 0) {
      // Get purchases made by users at this level
      const userIds = usersAtLevel.map(u => u.id);
      const purchases = await prisma.purchase.findMany({
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
        },
        include: {
          user: true,
          product: true,
        },
      });
      
      // Calculate commission for each purchase
      let levelCommission = 0;
      
      for (const purchase of purchases) {
        let commissionAmount = 0;
        
        if (levelRate.rewardType === 'percentage') {
          commissionAmount = purchase.totalPV * (levelRate.percentage / 100);
        } else {
          commissionAmount = levelRate.fixedAmount;
        }
        
        levelCommission += commissionAmount;
        
        levelDetails.push({
          level,
          purchaseId: purchase.id,
          userId: purchase.userId,
          userName: purchase.user.name,
          productName: purchase.product.name,
          pv: purchase.totalPV,
          commissionAmount,
        });
      }
      
      totalLevelCommissions += levelCommission;
      levelBreakdown[level] = levelCommission;
    }
  }
  
  result.levelCommissions = totalLevelCommissions;
  result.breakdown.levelCommissions = {
    amount: totalLevelCommissions,
    byLevel: levelBreakdown,
    details: levelDetails,
  };

  // 3. Calculate performance bonus if enabled
  if (config.performanceBonusEnabled) {
    // Calculate personal sales
    const personalSales = await prisma.purchase.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    const totalSales = personalSales._sum.totalAmount || 0;
    
    // Calculate performance bonus
    const performanceBonus = await calculatePerformanceBonus(totalSales);
    
    result.performanceBonus = performanceBonus;
    result.breakdown.performanceBonus = {
      amount: performanceBonus,
      details: {
        totalSales,
        bonusAmount: performanceBonus,
      },
    };
  }

  // Calculate total commission
  result.totalCommission = 
    result.directReferralBonus + 
    result.levelCommissions + 
    result.performanceBonus;

  return result;
}

/**
 * Update or create monthly performance record for a user
 * 
 * @param userId The ID of the user
 * @param year Year
 * @param month Month (1-12)
 * @param data Performance data
 * @returns Updated performance record
 */
export async function updateMonthlyPerformance(
  userId: number,
  year: number,
  month: number,
  data: {
    personalPV?: number;
    totalGroupPV?: number;
    directReferralBonus?: number;
    levelCommissions?: number;
    performanceBonus?: number;
    totalEarnings?: number;
  }
): Promise<any> {
  return await prisma.monthlyPerformance.upsert({
    where: {
      userId_year_month: {
        userId,
        year,
        month,
      },
    },
    update: data,
    create: {
      userId,
      year,
      month,
      ...data,
      // Set binary-specific fields to 0
      leftLegPV: 0,
      rightLegPV: 0,
      groupVolumeBonus: 0,
    },
  });
}

/**
 * Simulate earnings for a user for a specific month
 * 
 * @param userId The ID of the user
 * @param year Year
 * @param month Month (1-12)
 * @returns Simulated earnings
 */
export async function simulateEarnings(
  userId: number,
  year: number,
  month: number
): Promise<UnilevelCommissionResult> {
  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  // Calculate commissions
  const commissions = await calculateCommissions(userId, startDate, endDate);
  
  // Calculate personal PV
  const personalPV = await calculatePersonalPV(userId, startDate, endDate);
  
  // Calculate group PV
  const totalGroupPV = await calculateGroupPV(userId, startDate, endDate);
  
  // Update monthly performance
  await updateMonthlyPerformance(userId, year, month, {
    personalPV,
    totalGroupPV,
    directReferralBonus: commissions.directReferralBonus,
    levelCommissions: commissions.levelCommissions,
    performanceBonus: commissions.performanceBonus,
    totalEarnings: commissions.totalCommission,
  });
  
  return commissions;
}
