import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the request schema
const requestSchema = z.object({
  userId: z.string().transform(val => parseInt(val)),
  timeRange: z.enum(['last30days', 'last90days', 'last6months', 'last12months']).default('last30days'),
});

/**
 * GET /api/genealogy/metrics
 * Get metrics and analytics for the genealogy
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access genealogy metrics" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const timeRange = url.searchParams.get('timeRange') || 'last30days';
    
    // Validate parameters
    const validationResult = requestSchema.safeParse({
      userId,
      timeRange,
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId: validUserId, timeRange: validTimeRange } = validationResult.data;
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;
    
    switch (validTimeRange) {
      case 'last30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'last12months':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get all downline members for the user
    const downlineMembers = await getDownlineMembers(validUserId);
    const downlineMemberIds = downlineMembers.map(member => member.id);
    
    // Get total members count
    const totalMembers = downlineMembers.length;
    
    // Get active members count (members with at least one purchase in the time range)
    const activeMembers = await prisma.user.count({
      where: {
        id: {
          in: downlineMemberIds,
        },
        purchases: {
          some: {
            createdAt: {
              gte: startDate,
            },
            status: 'completed',
          },
        },
      },
    });
    
    // Get new members in the last 30 days
    const newMembersLast30Days = await prisma.user.count({
      where: {
        id: {
          in: downlineMemberIds,
        },
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    // Get total sales
    const salesData = await prisma.purchase.aggregate({
      where: {
        userId: {
          in: downlineMemberIds,
        },
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    const totalSales = salesData._sum.totalAmount || 0;
    
    // Calculate average sales per member
    const averageSalesPerMember = totalMembers > 0 ? totalSales / totalMembers : 0;
    
    // Get total rebates
    const rebatesData = await prisma.rebate.aggregate({
      where: {
        receiverId: {
          in: downlineMemberIds,
        },
        createdAt: {
          gte: startDate,
        },
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });
    
    const totalRebates = rebatesData._sum.amount || 0;
    
    // Get rank distribution
    const rankDistribution = await prisma.rank.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: {
              where: {
                id: {
                  in: downlineMemberIds,
                },
              },
            },
          },
        },
      },
      orderBy: {
        level: 'asc',
      },
    });
    
    // Format rank distribution
    const formattedRankDistribution = rankDistribution.map(rank => ({
      rankName: rank.name,
      count: rank._count.users,
    }));
    
    // Get sales by month
    const salesByMonth = await getSalesByMonth(downlineMemberIds, startDate);
    
    // Get new members by month
    const newMembersByMonth = await getNewMembersByMonth(downlineMemberIds, startDate);
    
    // Get top performers
    const topPerformers = await getTopPerformers(downlineMemberIds, startDate);
    
    // Get network depth
    const networkDepth = await getNetworkDepth(validUserId);
    
    // Return metrics data
    return NextResponse.json({
      totalMembers,
      activeMembers,
      newMembersLast30Days,
      totalSales,
      averageSalesPerMember,
      totalRebates,
      rankDistribution: formattedRankDistribution,
      salesByMonth,
      newMembersByMonth,
      topPerformers,
      networkDepth,
    });
  } catch (error) {
    console.error("Error fetching genealogy metrics:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch genealogy metrics" },
      { status: 500 }
    );
  }
}

/**
 * Get all downline members for a user
 */
async function getDownlineMembers(userId: number) {
  // Get all users in the downline
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      uplineId: true,
    },
  });
  
  // Build a map of upline to downline
  const downlineMap = new Map<number, number[]>();
  
  allUsers.forEach(user => {
    if (user.uplineId) {
      if (!downlineMap.has(user.uplineId)) {
        downlineMap.set(user.uplineId, []);
      }
      
      downlineMap.get(user.uplineId)?.push(user.id);
    }
  });
  
  // Get all downline members recursively
  const downlineMembers: { id: number }[] = [];
  
  function addDownlineMembers(id: number) {
    const directDownline = downlineMap.get(id) || [];
    
    directDownline.forEach(downlineId => {
      downlineMembers.push({ id: downlineId });
      addDownlineMembers(downlineId);
    });
  }
  
  // Start with the user
  addDownlineMembers(userId);
  
  return downlineMembers;
}

/**
 * Get sales by month
 */
async function getSalesByMonth(userIds: number[], startDate: Date) {
  // Get all purchases in the time range
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: {
        in: userIds,
      },
      createdAt: {
        gte: startDate,
      },
      status: 'completed',
    },
    select: {
      createdAt: true,
      totalAmount: true,
      userId: true,
    },
  });
  
  // Group purchases by month
  const salesByMonth = new Map<string, { personalSales: number; teamSales: number }>();
  
  purchases.forEach(purchase => {
    const month = purchase.createdAt.toISOString().substring(0, 7); // YYYY-MM
    
    if (!salesByMonth.has(month)) {
      salesByMonth.set(month, { personalSales: 0, teamSales: 0 });
    }
    
    const monthData = salesByMonth.get(month)!;
    
    // For simplicity, we'll consider all sales as team sales
    monthData.teamSales += purchase.totalAmount;
    
    // If the purchase is by the user, add to personal sales
    if (purchase.userId === userIds[0]) {
      monthData.personalSales += purchase.totalAmount;
    }
  });
  
  // Convert to array and sort by month
  const result = Array.from(salesByMonth.entries()).map(([month, data]) => ({
    month: formatMonth(month),
    personalSales: data.personalSales,
    teamSales: data.teamSales,
  }));
  
  // Sort by month
  result.sort((a, b) => {
    const monthA = a.month.split(' ');
    const monthB = b.month.split(' ');
    
    const yearA = parseInt(monthA[1]);
    const yearB = parseInt(monthB[1]);
    
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.indexOf(monthA[0]) - monthNames.indexOf(monthB[0]);
  });
  
  return result;
}

/**
 * Get new members by month
 */
async function getNewMembersByMonth(userIds: number[], startDate: Date) {
  // Get all users in the time range
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
    },
  });
  
  // Group users by month
  const membersByMonth = new Map<string, number>();
  
  users.forEach(user => {
    const month = user.createdAt.toISOString().substring(0, 7); // YYYY-MM
    
    if (!membersByMonth.has(month)) {
      membersByMonth.set(month, 0);
    }
    
    membersByMonth.set(month, membersByMonth.get(month)! + 1);
  });
  
  // Convert to array and sort by month
  const result = Array.from(membersByMonth.entries()).map(([month, count]) => ({
    month: formatMonth(month),
    count,
  }));
  
  // Sort by month
  result.sort((a, b) => {
    const monthA = a.month.split(' ');
    const monthB = b.month.split(' ');
    
    const yearA = parseInt(monthA[1]);
    const yearB = parseInt(monthB[1]);
    
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.indexOf(monthA[0]) - monthNames.indexOf(monthB[0]);
  });
  
  return result;
}

/**
 * Get top performers
 */
async function getTopPerformers(userIds: number[], startDate: Date) {
  // Get all purchases in the time range
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: {
        in: userIds,
      },
      createdAt: {
        gte: startDate,
      },
      status: 'completed',
    },
    select: {
      userId: true,
      totalAmount: true,
    },
  });
  
  // Group purchases by user
  const salesByUser = new Map<number, { personalSales: number; teamSales: number }>();
  
  purchases.forEach(purchase => {
    if (!salesByUser.has(purchase.userId)) {
      salesByUser.set(purchase.userId, { personalSales: 0, teamSales: 0 });
    }
    
    const userData = salesByUser.get(purchase.userId)!;
    userData.personalSales += purchase.totalAmount;
    userData.teamSales += purchase.totalAmount;
  });
  
  // Get user details
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: Array.from(salesByUser.keys()),
      },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          downline: true,
        },
      },
    },
  });
  
  // Combine user details with sales data
  const performers = users.map(user => {
    const salesData = salesByUser.get(user.id) || { personalSales: 0, teamSales: 0 };
    
    return {
      id: user.id,
      name: user.name,
      personalSales: salesData.personalSales,
      teamSales: salesData.teamSales,
      downlineCount: user._count.downline,
    };
  });
  
  // Sort by team sales
  performers.sort((a, b) => b.teamSales - a.teamSales);
  
  // Return top 5 performers
  return performers.slice(0, 5);
}

/**
 * Get network depth
 */
async function getNetworkDepth(userId: number) {
  // Get all users in the downline
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      uplineId: true,
    },
  });
  
  // Build a map of upline to downline
  const downlineMap = new Map<number, number[]>();
  
  allUsers.forEach(user => {
    if (user.uplineId) {
      if (!downlineMap.has(user.uplineId)) {
        downlineMap.set(user.uplineId, []);
      }
      
      downlineMap.get(user.uplineId)?.push(user.id);
    }
  });
  
  // Calculate network depth
  const levelCounts = new Map<number, number>();
  
  function countLevelMembers(id: number, level: number) {
    const directDownline = downlineMap.get(id) || [];
    
    if (!levelCounts.has(level)) {
      levelCounts.set(level, 0);
    }
    
    levelCounts.set(level, levelCounts.get(level)! + directDownline.length);
    
    directDownline.forEach(downlineId => {
      countLevelMembers(downlineId, level + 1);
    });
  }
  
  // Start with the user at level 0
  countLevelMembers(userId, 1);
  
  // Convert to array and sort by level
  const result = Array.from(levelCounts.entries()).map(([level, count]) => ({
    level,
    count,
  }));
  
  // Sort by level
  result.sort((a, b) => a.level - b.level);
  
  return result;
}

/**
 * Format month string (YYYY-MM) to MMM YYYY
 */
function formatMonth(month: string) {
  const [year, monthNum] = month.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
}
