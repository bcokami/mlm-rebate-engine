import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/genealogy/statistics
 * Get statistics about a user's genealogy
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy statistics" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    
    // Parse and validate userId
    let userId: number;
    
    if (userIdParam) {
      userId = parseInt(userIdParam);
      
      if (isNaN(userId)) {
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }
    } else {
      // Use the logged-in user's ID if no userId is provided
      userId = parseInt(session.user.id);
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
    
    // Get direct downline
    const directDownline = await prisma.user.findMany({
      where: {
        uplineId: userId,
      },
      select: {
        id: true,
      },
    });
    
    const directDownlineIds = directDownline.map(d => d.id);
    
    // Get level 2 downline
    const level2Downline = await prisma.user.findMany({
      where: {
        uplineId: {
          in: directDownlineIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    const level2DownlineIds = level2Downline.map(d => d.id);
    
    // Get level 3 downline
    const level3Downline = await prisma.user.findMany({
      where: {
        uplineId: {
          in: level2DownlineIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    const level3DownlineIds = level3Downline.map(d => d.id);
    
    // Get level 4 downline
    const level4Downline = await prisma.user.findMany({
      where: {
        uplineId: {
          in: level3DownlineIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    const level4DownlineIds = level4Downline.map(d => d.id);
    
    // Get level 5 downline
    const level5Downline = await prisma.user.findMany({
      where: {
        uplineId: {
          in: level4DownlineIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    const level5DownlineIds = level5Downline.map(d => d.id);
    
    // Get level 6 downline
    const level6Downline = await prisma.user.findMany({
      where: {
        uplineId: {
          in: level5DownlineIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    // Calculate total users
    const totalUsers = 1 + // The user
      directDownlineIds.length +
      level2DownlineIds.length +
      level3DownlineIds.length +
      level4DownlineIds.length +
      level5DownlineIds.length +
      level6Downline.length;
    
    // Get all downline IDs
    const allDownlineIds = [
      ...directDownlineIds,
      ...level2DownlineIds,
      ...level3DownlineIds,
      ...level4DownlineIds,
      ...level5DownlineIds,
      ...level6Downline.map(d => d.id),
    ];
    
    // Get active users in the last 30 days
    const activeUsers = await prisma.purchase.findMany({
      where: {
        userId: {
          in: allDownlineIds,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });
    
    const activeUserCount = activeUsers.length;
    const activeUserPercentage = allDownlineIds.length > 0
      ? (activeUserCount / allDownlineIds.length) * 100
      : 0;
    
    // Return statistics
    return NextResponse.json({
      totalUsers,
      directDownlineCount: directDownlineIds.length,
      levelCounts: {
        1: directDownlineIds.length,
        2: level2DownlineIds.length,
        3: level3DownlineIds.length,
        4: level4DownlineIds.length,
        5: level5DownlineIds.length,
        6: level6Downline.length,
      },
      activeUsersLast30Days: activeUserCount,
      activeUserPercentage,
    });
  } catch (error) {
    console.error("Error fetching genealogy statistics:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch genealogy statistics" },
      { status: 500 }
    );
  }
}
