import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/[id]/performance
 * Get performance metrics for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view performance metrics" },
        { status: 401 }
      );
    }
    
    // Parse user ID
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            downline: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get the user's downline
    const downline = await prisma.user.findMany({
      where: {
        uplineId: userId,
      },
      select: {
        id: true,
      },
    });
    
    const downlineIds = downline.map(d => d.id);
    
    // Get personal sales
    const personalSales = await prisma.purchase.aggregate({
      where: {
        userId: userId,
        status: 'completed',
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // Get team sales
    const teamSales = await prisma.purchase.aggregate({
      where: {
        userId: {
          in: downlineIds,
        },
        status: 'completed',
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    // Get rebates earned
    const rebatesEarned = await prisma.rebate.aggregate({
      where: {
        receiverId: userId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });
    
    // Get new team members in the last 30 days
    const newTeamMembers = await prisma.user.count({
      where: {
        uplineId: userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    // Calculate activity score based on recent purchases and referrals
    const recentActivity = await prisma.purchase.count({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });
    
    const recentReferrals = await prisma.user.count({
      where: {
        uplineId: userId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
    });
    
    // Calculate activity score (0-100)
    const activityScore = Math.min(100, (recentActivity * 10) + (recentReferrals * 20));
    
    // Return performance metrics
    return NextResponse.json({
      personalSales: personalSales._sum.totalAmount || 0,
      teamSales: teamSales._sum.totalAmount || 0,
      totalSales: (personalSales._sum.totalAmount || 0) + (teamSales._sum.totalAmount || 0),
      rebatesEarned: rebatesEarned._sum.amount || 0,
      teamSize: user._count.downline,
      newTeamMembers,
      activityScore,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}
