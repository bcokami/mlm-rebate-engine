import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the request schema
const requestSchema = z.object({
  userId1: z.string().transform(val => parseInt(val)),
  userId2: z.string().transform(val => parseInt(val)),
  timeRange: z.enum(['last30days', 'last90days', 'last6months', 'last12months']).default('last30days'),
});

/**
 * GET /api/genealogy/compare
 * Compare two genealogy trees
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to compare genealogy trees" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const userId1 = url.searchParams.get('userId1');
    const userId2 = url.searchParams.get('userId2');
    const timeRange = url.searchParams.get('timeRange') || 'last30days';
    
    // Validate parameters
    const validationResult = requestSchema.safeParse({
      userId1,
      userId2,
      timeRange,
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId1: validUserId1, userId2: validUserId2, timeRange: validTimeRange } = validationResult.data;
    
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
    
    // Get user 1 data
    const user1 = await prisma.user.findUnique({
      where: {
        id: validUserId1,
      },
      include: {
        rank: true,
        _count: {
          select: {
            downline: true,
          },
        },
      },
    });
    
    if (!user1) {
      return NextResponse.json(
        { error: "User 1 not found" },
        { status: 404 }
      );
    }
    
    // Get user 2 data
    const user2 = await prisma.user.findUnique({
      where: {
        id: validUserId2,
      },
      include: {
        rank: true,
        _count: {
          select: {
            downline: true,
          },
        },
      },
    });
    
    if (!user2) {
      return NextResponse.json(
        { error: "User 2 not found" },
        { status: 404 }
      );
    }
    
    // Get all downline members for user 1
    const downlineMembers1 = await getDownlineMembers(validUserId1);
    const downlineMemberIds1 = downlineMembers1.map(member => member.id);
    
    // Get all downline members for user 2
    const downlineMembers2 = await getDownlineMembers(validUserId2);
    const downlineMemberIds2 = downlineMembers2.map(member => member.id);
    
    // Calculate unique and common members
    const uniqueMembers1 = downlineMemberIds1.filter(id => !downlineMemberIds2.includes(id)).length;
    const uniqueMembers2 = downlineMemberIds2.filter(id => !downlineMemberIds1.includes(id)).length;
    const commonMembers = downlineMemberIds1.filter(id => downlineMemberIds2.includes(id)).length;
    
    // Get performance metrics for user 1
    const performanceMetrics1 = await getPerformanceMetrics(validUserId1, downlineMemberIds1, startDate);
    
    // Get performance metrics for user 2
    const performanceMetrics2 = await getPerformanceMetrics(validUserId2, downlineMemberIds2, startDate);
    
    // Calculate differences
    const downlineCountDiff = user1._count.downline - user2._count.downline;
    const downlineCountPercentage = user2._count.downline !== 0 
      ? (downlineCountDiff / user2._count.downline) * 100 
      : 0;
    
    const personalSalesDiff = performanceMetrics1.personalSales - performanceMetrics2.personalSales;
    const personalSalesPercentage = performanceMetrics2.personalSales !== 0 
      ? (personalSalesDiff / performanceMetrics2.personalSales) * 100 
      : 0;
    
    const teamSalesDiff = performanceMetrics1.teamSales - performanceMetrics2.teamSales;
    const teamSalesPercentage = performanceMetrics2.teamSales !== 0 
      ? (teamSalesDiff / performanceMetrics2.teamSales) * 100 
      : 0;
    
    const rebatesEarnedDiff = performanceMetrics1.rebatesEarned - performanceMetrics2.rebatesEarned;
    const rebatesEarnedPercentage = performanceMetrics2.rebatesEarned !== 0 
      ? (rebatesEarnedDiff / performanceMetrics2.rebatesEarned) * 100 
      : 0;
    
    const newMembersDiff = performanceMetrics1.newTeamMembers - performanceMetrics2.newTeamMembers;
    const newMembersPercentage = performanceMetrics2.newTeamMembers !== 0 
      ? (newMembersDiff / performanceMetrics2.newTeamMembers) * 100 
      : 0;
    
    // Prepare response
    const response = {
      user1: {
        id: user1.id,
        name: user1.name,
        email: user1.email,
        rankName: user1.rank.name,
        downlineCount: user1._count.downline,
        walletBalance: user1.walletBalance,
        createdAt: user1.createdAt,
        performanceMetrics: performanceMetrics1,
      },
      user2: {
        id: user2.id,
        name: user2.name,
        email: user2.email,
        rankName: user2.rank.name,
        downlineCount: user2._count.downline,
        walletBalance: user2.walletBalance,
        createdAt: user2.createdAt,
        performanceMetrics: performanceMetrics2,
      },
      differences: {
        downlineCount: downlineCountDiff,
        downlineCountPercentage,
        personalSales: personalSalesDiff,
        personalSalesPercentage,
        teamSales: teamSalesDiff,
        teamSalesPercentage,
        rebatesEarned: rebatesEarnedDiff,
        rebatesEarnedPercentage,
        newMembers: newMembersDiff,
        newMembersPercentage,
        uniqueMembers1,
        uniqueMembers2,
        commonMembers,
      },
      timeRange: validTimeRange,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error comparing genealogy trees:", error);
    
    return NextResponse.json(
      { error: "Failed to compare genealogy trees" },
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
 * Get performance metrics for a user
 */
async function getPerformanceMetrics(userId: number, downlineMemberIds: number[], startDate: Date) {
  // Get personal sales
  const personalSalesData = await prisma.purchase.aggregate({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
      status: 'completed',
    },
    _sum: {
      totalAmount: true,
    },
  });
  
  const personalSales = personalSalesData._sum.totalAmount || 0;
  
  // Get team sales
  const teamSalesData = await prisma.purchase.aggregate({
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
  
  const teamSales = teamSalesData._sum.totalAmount || 0;
  
  // Get total sales (personal + team)
  const totalSales = personalSales + teamSales;
  
  // Get rebates earned
  const rebatesData = await prisma.rebate.aggregate({
    where: {
      receiverId: userId,
      createdAt: {
        gte: startDate,
      },
      status: 'completed',
    },
    _sum: {
      amount: true,
    },
  });
  
  const rebatesEarned = rebatesData._sum.amount || 0;
  
  // Get new team members
  const newTeamMembers = await prisma.user.count({
    where: {
      id: {
        in: downlineMemberIds,
      },
      createdAt: {
        gte: startDate,
      },
    },
  });
  
  // Get team size
  const teamSize = downlineMemberIds.length;
  
  return {
    personalSales,
    teamSales,
    totalSales,
    rebatesEarned,
    teamSize,
    newTeamMembers,
  };
}
