import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Function to recursively fetch downline users up to a specified depth
async function getDownlineUsers(userId: number, currentDepth = 1, maxDepth = 10) {
  if (currentDepth > maxDepth) {
    return [];
  }

  const directDownline = await prisma.user.findMany({
    where: {
      uplineId: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      rankId: true,
      walletBalance: true,
      createdAt: true,
      rank: {
        select: {
          name: true,
          level: true,
        },
      },
    },
  });

  // For each direct downline, recursively get their downline
  const result = await Promise.all(
    directDownline.map(async (user) => {
      const children = await getDownlineUsers(user.id, currentDepth + 1, maxDepth);
      return {
        ...user,
        children,
        level: currentDepth,
      };
    })
  );

  return result;
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const maxDepth = parseInt(url.searchParams.get("maxDepth") || "10");
    const includeStats = url.searchParams.get("includeStats") === "true";

    // Determine which user's genealogy to fetch
    let targetUserId: number;

    if (userId) {
      // If userId is provided, check if the authenticated user has permission to view it
      // For simplicity, we'll allow any authenticated user to view any genealogy
      // In a real application, you might want to add more permission checks
      targetUserId = parseInt(userId);
    } else {
      // If no userId is provided, use the authenticated user's ID
      targetUserId = parseInt(session.user.id);
    }

    // Get the root user
    const rootUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        rank: {
          select: {
            name: true,
            level: true,
          },
        },
      },
    });

    if (!rootUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the downline users
    const downlineUsers = await getDownlineUsers(targetUserId, 1, maxDepth);

    // Create the genealogy tree
    const genealogyTree = {
      ...rootUser,
      children: downlineUsers,
      level: 0,
    };

    // Calculate statistics if requested
    let statistics = null;
    if (includeStats) {
      // Count users by level
      const levelCounts: Record<number, number> = {};
      
      // Function to count users by level
      const countByLevel = (node: any, level: number) => {
        levelCounts[level] = (levelCounts[level] || 0) + 1;
        
        if (node.children && node.children.length > 0) {
          node.children.forEach((child: any) => {
            countByLevel(child, level + 1);
          });
        }
      };
      
      // Start counting from the root
      countByLevel(genealogyTree, 0);
      
      // Calculate total users
      const totalUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);
      
      // Get total wallet balance of all downline users
      let totalDownlineBalance = 0;
      const calculateTotalBalance = (node: any) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach((child: any) => {
            totalDownlineBalance += child.walletBalance || 0;
            calculateTotalBalance(child);
          });
        }
      };
      
      calculateTotalBalance(genealogyTree);
      
      statistics = {
        totalUsers,
        levelCounts,
        totalDownlineBalance,
        directDownlineCount: downlineUsers.length,
      };
    }

    return NextResponse.json({
      genealogy: genealogyTree,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching genealogy:", error);
    return NextResponse.json(
      { error: "Failed to fetch genealogy" },
      { status: 500 }
    );
  }
}
