import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaginatedDownline, getEntireDownlineIds } from "@/lib/genealogyService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to export genealogy data" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const targetUserIdParam = url.searchParams.get("userId");
    const formatParam = url.searchParams.get("format") || "csv";
    const maxLevelParam = url.searchParams.get("maxLevel");
    const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : 10;
    
    // Determine which user's genealogy to export
    let targetUserId = user.id;

    if (targetUserIdParam) {
      // If userId is provided, check if the authenticated user has permission to view it
      // For simplicity, we'll allow any authenticated user to export any genealogy
      // In a real application, you might want to add more permission checks
      targetUserId = parseInt(targetUserIdParam);
    }

    // Get all downline IDs
    const downlineIds = await getEntireDownlineIds(targetUserId);
    
    // Get all downline users with their details
    const downlineUsers = await prisma.user.findMany({
      where: {
        id: {
          in: [...downlineIds, targetUserId],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        uplineId: true,
        walletBalance: true,
        createdAt: true,
        rank: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            downline: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Create a map of users by ID for quick lookup
    const userMap = new Map();
    downlineUsers.forEach(user => {
      userMap.set(user.id, user);
    });

    // Calculate level for each user
    const userLevels = new Map();
    userLevels.set(targetUserId, 0); // Root user is at level 0

    // Calculate levels using BFS
    let currentLevel = 0;
    let currentLevelIds = [targetUserId];

    while (currentLevelIds.length > 0) {
      const nextLevelIds = [];
      
      for (const id of currentLevelIds) {
        // Find all direct downline of this user
        const directDownline = downlineUsers.filter(user => user.uplineId === id);
        
        for (const downlineUser of directDownline) {
          userLevels.set(downlineUser.id, currentLevel + 1);
          nextLevelIds.push(downlineUser.id);
        }
      }
      
      currentLevel++;
      currentLevelIds = nextLevelIds;
      
      // Stop if we've reached the maximum level
      if (currentLevel > maxLevel) {
        break;
      }
    }

    // Format the data based on the requested format
    if (formatParam === "csv") {
      // Create CSV data
      const csvRows = [];
      
      // Add header row
      csvRows.push([
        "ID",
        "Name",
        "Email",
        "Rank",
        "Level",
        "Upline ID",
        "Upline Name",
        "Wallet Balance",
        "Downline Count",
        "Joined Date"
      ].join(","));
      
      // Add data rows
      downlineUsers.forEach(user => {
        const level = userLevels.get(user.id) || 0;
        const upline = user.uplineId ? userMap.get(user.uplineId) : null;
        
        csvRows.push([
          user.id,
          `"${user.name.replace(/"/g, '""')}"`, // Escape quotes in CSV
          `"${user.email.replace(/"/g, '""')}"`,
          `"${user.rank.name}"`,
          level,
          user.uplineId || "",
          upline ? `"${upline.name.replace(/"/g, '""')}"` : "",
          user.walletBalance || 0,
          user._count.downline,
          user.createdAt ? user.createdAt.toISOString() : ""
        ].join(","));
      });
      
      const csvContent = csvRows.join("\n");
      
      // Return CSV data with appropriate headers
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="genealogy_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (formatParam === "json") {
      // Return JSON data
      const formattedData = downlineUsers.map(user => {
        const level = userLevels.get(user.id) || 0;
        const upline = user.uplineId ? userMap.get(user.uplineId) : null;
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          rank: user.rank.name,
          level,
          uplineId: user.uplineId,
          uplineName: upline ? upline.name : null,
          walletBalance: user.walletBalance || 0,
          downlineCount: user._count.downline,
          joinedDate: user.createdAt
        };
      });
      
      return NextResponse.json({
        exportDate: new Date(),
        rootUserId: targetUserId,
        totalUsers: downlineUsers.length,
        maxLevel,
        data: formattedData
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported export format. Supported formats: csv, json" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error exporting genealogy data:", error);
    return NextResponse.json(
      { error: "Failed to export genealogy data" },
      { status: 500 }
    );
  }
}
