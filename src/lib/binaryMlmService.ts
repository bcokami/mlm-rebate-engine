import { prisma } from "./prisma";

/**
 * Interface for binary MLM user data
 */
export interface BinaryMlmUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  uplineId: number | null;
  leftLegId: number | null;
  rightLegId: number | null;
  placementPosition: string | null;
  walletBalance: number;
  rank: {
    id: number;
    name: string;
    level: number;
  };
}

/**
 * Interface for binary MLM tree node
 */
export interface BinaryTreeNode {
  user: BinaryMlmUser;
  level: number;
  position: string | null;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

/**
 * Interface for commission calculation result
 */
export interface CommissionResult {
  directReferralBonus: number;
  levelCommissions: number;
  groupVolumeBonus: number;
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
    groupVolume: {
      amount: number;
      details: any[];
    };
  };
}

/**
 * Get a user's binary placement options
 * 
 * @param uplineId The ID of the upline user
 * @returns Available placement positions
 */
export async function getPlacementOptions(uplineId: number): Promise<string[]> {
  const upline = await prisma.user.findUnique({
    where: { id: uplineId },
    select: {
      id: true,
      leftLegId: true,
      rightLegId: true,
    },
  });

  if (!upline) {
    throw new Error(`Upline user with ID ${uplineId} not found`);
  }

  const availablePositions: string[] = [];

  if (upline.leftLegId === null) {
    availablePositions.push('left');
  }

  if (upline.rightLegId === null) {
    availablePositions.push('right');
  }

  return availablePositions;
}

/**
 * Find the next available placement in the binary tree
 * 
 * @param startUserId The ID of the user to start searching from
 * @param preferredLeg The preferred leg to place in ('left' or 'right')
 * @returns The user ID and position for placement
 */
export async function findNextAvailablePlacement(
  startUserId: number,
  preferredLeg: 'left' | 'right' = 'left'
): Promise<{ userId: number; position: 'left' | 'right' }> {
  // Start with the specified user
  let currentUserId = startUserId;
  let queue: { userId: number; position: 'left' | 'right' }[] = [];

  // First try the preferred leg of the start user
  const startUser = await prisma.user.findUnique({
    where: { id: startUserId },
    select: {
      id: true,
      leftLegId: true,
      rightLegId: true,
    },
  });

  if (!startUser) {
    throw new Error(`User with ID ${startUserId} not found`);
  }

  // Check if the preferred leg is available
  if (preferredLeg === 'left' && startUser.leftLegId === null) {
    return { userId: startUserId, position: 'left' };
  } else if (preferredLeg === 'right' && startUser.rightLegId === null) {
    return { userId: startUserId, position: 'right' };
  }

  // If preferred leg is not available, try the other leg
  const otherLeg = preferredLeg === 'left' ? 'right' : 'left';
  if (otherLeg === 'left' && startUser.leftLegId === null) {
    return { userId: startUserId, position: 'left' };
  } else if (otherLeg === 'right' && startUser.rightLegId === null) {
    return { userId: startUserId, position: 'right' };
  }

  // If both legs are filled, perform a breadth-first search
  // Start with the preferred leg
  if (preferredLeg === 'left' && startUser.leftLegId !== null) {
    queue.push({ userId: startUser.leftLegId, position: 'left' });
  }
  if (preferredLeg === 'right' && startUser.rightLegId !== null) {
    queue.push({ userId: startUser.rightLegId, position: 'right' });
  }

  // Then add the other leg
  if (otherLeg === 'left' && startUser.leftLegId !== null) {
    queue.push({ userId: startUser.leftLegId, position: 'left' });
  }
  if (otherLeg === 'right' && startUser.rightLegId !== null) {
    queue.push({ userId: startUser.rightLegId, position: 'right' });
  }

  // Process the queue
  while (queue.length > 0) {
    const { userId } = queue.shift()!;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        leftLegId: true,
        rightLegId: true,
      },
    });

    if (!user) continue;

    // Check if this user has an available position
    if (user.leftLegId === null) {
      return { userId, position: 'left' };
    }

    if (user.rightLegId === null) {
      return { userId, position: 'right' };
    }

    // Add this user's children to the queue
    if (user.leftLegId !== null) {
      queue.push({ userId: user.leftLegId, position: 'left' });
    }

    if (user.rightLegId !== null) {
      queue.push({ userId: user.rightLegId, position: 'right' });
    }
  }

  // If we get here, there's no available placement (should never happen in practice)
  throw new Error('No available placement found in the binary tree');
}

/**
 * Place a user in the binary tree
 * 
 * @param userId The ID of the user to place
 * @param uplineId The ID of the upline user
 * @param position The position to place the user ('left' or 'right')
 * @returns The updated user
 */
export async function placeUserInBinaryTree(
  userId: number,
  uplineId: number,
  position: 'left' | 'right'
): Promise<BinaryMlmUser> {
  // Check if the position is available
  const upline = await prisma.user.findUnique({
    where: { id: uplineId },
    select: {
      id: true,
      leftLegId: true,
      rightLegId: true,
    },
  });

  if (!upline) {
    throw new Error(`Upline user with ID ${uplineId} not found`);
  }

  if (position === 'left' && upline.leftLegId !== null) {
    throw new Error(`Left position is already filled for upline ${uplineId}`);
  }

  if (position === 'right' && upline.rightLegId !== null) {
    throw new Error(`Right position is already filled for upline ${uplineId}`);
  }

  // Update the upline user with the new downline
  await prisma.user.update({
    where: { id: uplineId },
    data: {
      [position === 'left' ? 'leftLegId' : 'rightLegId']: userId,
    },
  });

  // Update the user with the placement position
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      uplineId,
      placementPosition: position,
    },
    include: {
      rank: true,
    },
  });

  return updatedUser as BinaryMlmUser;
}

/**
 * Build a binary tree structure for a user
 * 
 * @param userId The ID of the root user
 * @param maxDepth Maximum depth of the tree
 * @returns Binary tree structure
 */
export async function buildBinaryTree(
  userId: number,
  maxDepth: number = 6
): Promise<BinaryTreeNode> {
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
  return await buildBinaryTreeRecursive(rootUser as BinaryMlmUser, 0, maxDepth, null);
}

/**
 * Recursively build a binary tree
 * 
 * @param user The current user
 * @param currentDepth Current depth in the tree
 * @param maxDepth Maximum depth to build
 * @param position Position in parent's tree
 * @returns Binary tree node
 */
async function buildBinaryTreeRecursive(
  user: BinaryMlmUser,
  currentDepth: number,
  maxDepth: number,
  position: string | null
): Promise<BinaryTreeNode> {
  if (currentDepth > maxDepth) {
    return {
      user,
      level: currentDepth,
      position,
      left: null,
      right: null,
    };
  }

  // Create the current node
  const node: BinaryTreeNode = {
    user,
    level: currentDepth,
    position,
    left: null,
    right: null,
  };

  // Get left and right legs if they exist
  if (user.leftLegId !== null) {
    const leftLeg = await prisma.user.findUnique({
      where: { id: user.leftLegId },
      include: {
        rank: true,
      },
    });

    if (leftLeg) {
      node.left = await buildBinaryTreeRecursive(
        leftLeg as BinaryMlmUser,
        currentDepth + 1,
        maxDepth,
        'left'
      );
    }
  }

  if (user.rightLegId !== null) {
    const rightLeg = await prisma.user.findUnique({
      where: { id: user.rightLegId },
      include: {
        rank: true,
      },
    });

    if (rightLeg) {
      node.right = await buildBinaryTreeRecursive(
        rightLeg as BinaryMlmUser,
        currentDepth + 1,
        maxDepth,
        'right'
      );
    }
  }

  return node;
}

/**
 * Get all users in a user's downline up to a specified level
 * 
 * @param userId The ID of the user
 * @param maxLevel Maximum level to retrieve
 * @returns Array of users with their level and position
 */
export async function getDownlineByLevel(
  userId: number,
  maxLevel: number = 6
): Promise<{ user: BinaryMlmUser; level: number; position: string | null }[]> {
  // Build the binary tree
  const tree = await buildBinaryTree(userId, maxLevel);
  
  // Flatten the tree into an array
  const result: { user: BinaryMlmUser; level: number; position: string | null }[] = [];
  
  // Helper function to traverse the tree
  function traverseTree(node: BinaryTreeNode) {
    result.push({
      user: node.user,
      level: node.level,
      position: node.position,
    });
    
    if (node.left) {
      traverseTree(node.left);
    }
    
    if (node.right) {
      traverseTree(node.right);
    }
  }
  
  // Start traversal from the root
  traverseTree(tree);
  
  return result;
}

/**
 * Calculate PV (Point Value) for a user's downline
 * 
 * @param userId The ID of the user
 * @param startDate Start date for the calculation period
 * @param endDate End date for the calculation period
 * @returns PV calculations for left and right legs
 */
export async function calculateDownlinePV(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<{ leftLegPV: number; rightLegPV: number; totalPV: number }> {
  // Get the user's left and right legs
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      leftLegId: true,
      rightLegId: true,
    },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  let leftLegPV = 0;
  let rightLegPV = 0;

  // Calculate PV for left leg
  if (user.leftLegId !== null) {
    leftLegPV = await calculateTotalPV(user.leftLegId, startDate, endDate);
  }

  // Calculate PV for right leg
  if (user.rightLegId !== null) {
    rightLegPV = await calculateTotalPV(user.rightLegId, startDate, endDate);
  }

  return {
    leftLegPV,
    rightLegPV,
    totalPV: leftLegPV + rightLegPV,
  };
}

/**
 * Calculate total PV for a user and their entire downline
 * 
 * @param userId The ID of the user
 * @param startDate Start date for the calculation period
 * @param endDate End date for the calculation period
 * @returns Total PV
 */
export async function calculateTotalPV(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<number> {
  // Get all users in the downline
  const downline = await getDownlineByLevel(userId);
  
  // Add the root user
  const userIds = [userId, ...downline.map(d => d.user.id)];
  
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
): Promise<CommissionResult> {
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
  const groupVolumeRate = commissionRates.find(r => r.type === 'group_volume');

  // Initialize result
  const result: CommissionResult = {
    directReferralBonus: 0,
    levelCommissions: 0,
    groupVolumeBonus: 0,
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
      groupVolume: {
        amount: 0,
        details: [],
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
  const downlineByLevel = await getDownlineByLevel(userId, 6);
  
  // Group users by level
  const usersByLevel = downlineByLevel.reduce((acc, item) => {
    const level = item.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(item.user);
    return acc;
  }, {} as Record<number, BinaryMlmUser[]>);

  // Calculate commissions for each level
  let totalLevelCommissions = 0;
  const levelBreakdown: Record<number, number> = {};
  const levelDetails: any[] = [];

  for (let level = 1; level <= 6; level++) {
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

  // 3. Calculate group volume bonus
  if (groupVolumeRate) {
    // Calculate PV for left and right legs
    const { leftLegPV, rightLegPV } = await calculateDownlinePV(userId, startDate, endDate);
    
    // Group volume bonus is typically calculated on the weaker leg
    const weakerLegPV = Math.min(leftLegPV, rightLegPV);
    
    let groupVolumeBonus = 0;
    if (groupVolumeRate.rewardType === 'percentage') {
      groupVolumeBonus = weakerLegPV * (groupVolumeRate.percentage / 100);
    } else {
      // For fixed amount, we might use a tier system based on PV
      // This is a simplified example
      groupVolumeBonus = Math.floor(weakerLegPV / 1000) * groupVolumeRate.fixedAmount;
    }
    
    result.groupVolumeBonus = groupVolumeBonus;
    result.breakdown.groupVolume = {
      amount: groupVolumeBonus,
      details: [{
        leftLegPV,
        rightLegPV,
        weakerLegPV,
        bonusRate: groupVolumeRate.rewardType === 'percentage' 
          ? `${groupVolumeRate.percentage}%` 
          : `${groupVolumeRate.fixedAmount} per 1000 PV`,
        bonusAmount: groupVolumeBonus,
      }],
    };
  }

  // Calculate total commission
  result.totalCommission = 
    result.directReferralBonus + 
    result.levelCommissions + 
    result.groupVolumeBonus;

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
    leftLegPV?: number;
    rightLegPV?: number;
    totalGroupPV?: number;
    directReferralBonus?: number;
    levelCommissions?: number;
    groupVolumeBonus?: number;
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
    },
  });
}

/**
 * Get monthly performance for a user
 * 
 * @param userId The ID of the user
 * @param year Year (optional)
 * @param month Month (1-12, optional)
 * @returns Performance records
 */
export async function getMonthlyPerformance(
  userId: number,
  year?: number,
  month?: number
): Promise<any[]> {
  const whereClause: any = { userId };
  
  if (year !== undefined) {
    whereClause.year = year;
  }
  
  if (month !== undefined) {
    whereClause.month = month;
  }
  
  return await prisma.monthlyPerformance.findMany({
    where: whereClause,
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });
}

/**
 * Get top earners for a specific period
 * 
 * @param year Year
 * @param month Month (1-12)
 * @param limit Maximum number of users to return
 * @returns Top earners with their earnings
 */
export async function getTopEarners(
  year: number,
  month: number,
  limit: number = 10
): Promise<any[]> {
  return await prisma.monthlyPerformance.findMany({
    where: {
      year,
      month,
    },
    orderBy: {
      totalEarnings: 'desc',
    },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          rankId: true,
          rank: true,
        },
      },
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
): Promise<CommissionResult> {
  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  // Calculate commissions
  const commissions = await calculateCommissions(userId, startDate, endDate);
  
  // Calculate personal PV
  const personalPV = await calculatePersonalPV(userId, startDate, endDate);
  
  // Calculate downline PV
  const { leftLegPV, rightLegPV, totalPV } = await calculateDownlinePV(userId, startDate, endDate);
  
  // Update monthly performance
  await updateMonthlyPerformance(userId, year, month, {
    personalPV,
    leftLegPV,
    rightLegPV,
    totalGroupPV: totalPV,
    directReferralBonus: commissions.directReferralBonus,
    levelCommissions: commissions.levelCommissions,
    groupVolumeBonus: commissions.groupVolumeBonus,
    totalEarnings: commissions.totalCommission,
  });
  
  return commissions;
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
