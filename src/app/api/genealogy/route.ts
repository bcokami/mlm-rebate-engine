import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaginatedDownline, getDownlineLevelCounts } from "@/lib/genealogyService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    // In NextAuth, the user ID is stored in the token's sub field
    // We need to look it up in the database
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

    const userId = user.id;

    // Get query parameters
    const url = new URL(request.url);
    const maxLevelParam = url.searchParams.get("maxLevel");
    const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : 10;
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;
    const includeStats = url.searchParams.get("includeStats") === "true";
    const targetUserIdParam = url.searchParams.get("userId");

    // Determine which user's genealogy to fetch
    let targetUserId = userId;

    if (targetUserIdParam) {
      // If userId is provided, check if the authenticated user has permission to view it
      // For simplicity, we'll allow any authenticated user to view any genealogy
      // In a real application, you might want to add more permission checks
      targetUserId = parseInt(targetUserIdParam);
    }

    // Get paginated downline
    const genealogyData = await getPaginatedDownline(targetUserId, maxLevel, page, pageSize);

    // Format the response
    const genealogyTree = {
      ...genealogyData.user,
      children: genealogyData.downline,
      pagination: genealogyData.pagination,
    };

    // Calculate statistics if requested
    let statistics = null;
    if (includeStats) {
      // Get level counts
      const levelCounts = await getDownlineLevelCounts(targetUserId, maxLevel);

      // Calculate total users
      const totalUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0) + 1; // +1 for the root user

      // Get direct downline count
      const directDownlineCount = levelCounts[1] || 0;

      // Calculate total wallet balance of downline users
      let totalDownlineBalance = 0;

      // Get all downline users
      const downlineUsers = await prisma.user.findMany({
        where: {
          uplineId: targetUserId,
        },
        select: {
          walletBalance: true,
        },
      });

      // Sum up wallet balances
      totalDownlineBalance = downlineUsers.reduce((sum, user) => sum + (user.walletBalance || 0), 0);

      statistics = {
        totalUsers,
        levelCounts,
        totalDownlineBalance,
        directDownlineCount,
      };
    }

    // Return the genealogy tree with statistics if requested
    return NextResponse.json({
      ...genealogyTree,
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
