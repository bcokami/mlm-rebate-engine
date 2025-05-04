const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to calculate personal PV
async function calculatePersonalPV(userId, startDate, endDate) {
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

// Helper function to get all users in a downline
async function getDownlineUsers(userId) {
  // This is a simplified version that just gets direct downlines
  // In a real implementation, you would recursively get all downline users
  return await prisma.user.findMany({
    where: {
      uplineId: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

// Helper function to calculate downline PV
async function calculateDownlinePV(userId, startDate, endDate) {
  // Get left and right leg IDs
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
  if (user.leftLegId) {
    // Get all purchases in the left leg
    const leftLegPurchases = await prisma.purchase.findMany({
      where: {
        userId: user.leftLegId,
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
    
    leftLegPV = leftLegPurchases.reduce((sum, purchase) => sum + purchase.totalPV, 0);
    
    // Add PV from downline of left leg (simplified)
    const leftLegDownline = await getDownlineUsers(user.leftLegId);
    
    for (const downlineUser of leftLegDownline) {
      const downlinePV = await calculatePersonalPV(downlineUser.id, startDate, endDate);
      leftLegPV += downlinePV;
    }
  }

  // Calculate PV for right leg
  if (user.rightLegId) {
    // Get all purchases in the right leg
    const rightLegPurchases = await prisma.purchase.findMany({
      where: {
        userId: user.rightLegId,
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
    
    rightLegPV = rightLegPurchases.reduce((sum, purchase) => sum + purchase.totalPV, 0);
    
    // Add PV from downline of right leg (simplified)
    const rightLegDownline = await getDownlineUsers(user.rightLegId);
    
    for (const downlineUser of rightLegDownline) {
      const downlinePV = await calculatePersonalPV(downlineUser.id, startDate, endDate);
      rightLegPV += downlinePV;
    }
  }

  return {
    leftLegPV,
    rightLegPV,
    totalPV: leftLegPV + rightLegPV,
  };
}

// Helper function to calculate commissions
async function calculateCommissions(userId, startDate, endDate) {
  // Get commission rates
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
    }, {});
  const groupVolumeRate = commissionRates.find(r => r.type === 'group_volume');

  // Initialize result
  const result = {
    directReferralBonus: 0,
    levelCommissions: 0,
    groupVolumeBonus: 0,
    totalCommission: 0,
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
  });

  if (directReferralRate) {
    const bonusPerReferral = directReferralRate.rewardType === 'fixed'
      ? directReferralRate.fixedAmount
      : 0;

    result.directReferralBonus = bonusPerReferral * directReferrals.length;
  }

  // 2. Calculate level-based commissions (simplified)
  // For each level, get users and their purchases
  let totalLevelCommissions = 0;

  for (let level = 1; level <= 6; level++) {
    const levelRate = levelRates[level];
    
    if (levelRate) {
      // In a real implementation, you would get all users at this level
      // For simplicity, we'll just use a percentage of the total PV
      const { totalPV } = await calculateDownlinePV(userId, startDate, endDate);
      
      // Apply a decreasing factor based on level
      const levelFactor = 1 / Math.pow(2, level - 1);
      const levelPV = totalPV * levelFactor;
      
      let levelCommission = 0;
      
      if (levelRate.rewardType === 'percentage') {
        levelCommission = levelPV * (levelRate.percentage / 100);
      } else {
        levelCommission = levelRate.fixedAmount;
      }
      
      totalLevelCommissions += levelCommission;
    }
  }
  
  result.levelCommissions = totalLevelCommissions;

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
      groupVolumeBonus = Math.floor(weakerLegPV / 1000) * groupVolumeRate.fixedAmount;
    }
    
    result.groupVolumeBonus = groupVolumeBonus;
  }

  // Calculate total commission
  result.totalCommission = 
    result.directReferralBonus + 
    result.levelCommissions + 
    result.groupVolumeBonus;

  return result;
}

// Helper function to update or create monthly performance
async function updateMonthlyPerformance(userId, year, month, data) {
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

// Main function to simulate earnings
async function simulateEarnings(userId, year, month) {
  try {
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    console.log(`Simulating earnings for user ${userId} for ${year}-${month}...`);
    
    // Calculate personal PV
    const personalPV = await calculatePersonalPV(userId, startDate, endDate);
    console.log(`Personal PV: ${personalPV}`);
    
    // Calculate downline PV
    const { leftLegPV, rightLegPV, totalPV } = await calculateDownlinePV(userId, startDate, endDate);
    console.log(`Left Leg PV: ${leftLegPV}`);
    console.log(`Right Leg PV: ${rightLegPV}`);
    console.log(`Total Group PV: ${totalPV}`);
    
    // Calculate commissions
    const commissions = await calculateCommissions(userId, startDate, endDate);
    console.log(`Direct Referral Bonus: ${commissions.directReferralBonus}`);
    console.log(`Level Commissions: ${commissions.levelCommissions}`);
    console.log(`Group Volume Bonus: ${commissions.groupVolumeBonus}`);
    console.log(`Total Commission: ${commissions.totalCommission}`);
    
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
    
    console.log(`Monthly performance updated for user ${userId}`);
    
    return {
      userId,
      year,
      month,
      personalPV,
      leftLegPV,
      rightLegPV,
      totalPV,
      commissions,
    };
  } catch (error) {
    console.error(`Error simulating earnings for user ${userId}:`, error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    console.log(`Found ${users.length} users`);
    
    // Simulate earnings for April 2023
    const year = 2023;
    const month = 4;
    
    for (const user of users) {
      console.log(`\nSimulating earnings for ${user.name} (${user.email})...`);
      
      await simulateEarnings(user.id, year, month);
    }
    
    console.log('\nEarnings simulation completed successfully!');
  } catch (error) {
    console.error('Error simulating earnings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Simulation script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Simulation script failed:', error);
    process.exit(1);
  });
