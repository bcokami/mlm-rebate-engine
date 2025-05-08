import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getPaginatedDownline,
  getDownlineLevelCounts,
  loadAdditionalLevels,
  getUserPerformanceMetrics
} from "@/lib/genealogyService";

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
    const includePerformanceMetrics = url.searchParams.get("includePerformanceMetrics") === "true";
    const targetUserIdParam = url.searchParams.get("userId");
    const loadAdditionalLevelsParam = url.searchParams.get("loadAdditionalLevels");
    const currentLevelParam = url.searchParams.get("currentLevel");
    const filterRankParam = url.searchParams.get("filterRank");
    const filterJoinedAfterParam = url.searchParams.get("filterJoinedAfter");
    const filterJoinedBeforeParam = url.searchParams.get("filterJoinedBefore");
    const sortByParam = url.searchParams.get("sortBy");
    const sortDirectionParam = url.searchParams.get("sortDirection") as "asc" | "desc" | null;
    const lazyLoadLevels = url.searchParams.get("lazyLoad") === "true";

    // Determine which user's genealogy to fetch
    let targetUserId = userId;

    if (targetUserIdParam) {
      // If userId is provided, check if the authenticated user has permission to view it
      // For simplicity, we'll allow any authenticated user to view any genealogy
      // In a real application, you might want to add more permission checks
      targetUserId = parseInt(targetUserIdParam);
    }

    // Check if we need to load additional levels for a specific node
    if (loadAdditionalLevelsParam === "true" && currentLevelParam) {
      const currentLevel = parseInt(currentLevelParam);
      const additionalLevelsData = await loadAdditionalLevels(
        targetUserId,
        currentLevel,
        maxLevel
      );

      return NextResponse.json(additionalLevelsData);
    }

    // Build options for the genealogy query
    const options: any = {
      includePerformanceMetrics,
      lazyLoadLevels
    };

    // Add filtering options if provided
    if (filterRankParam) {
      options.filterRank = parseInt(filterRankParam);
    }

    if (filterJoinedAfterParam) {
      options.filterJoinedAfter = new Date(filterJoinedAfterParam);
    }

    if (filterJoinedBeforeParam) {
      options.filterJoinedBefore = new Date(filterJoinedBeforeParam);
    }

    // Add sorting options if provided
    if (sortByParam) {
      options.sortBy = sortByParam;
    }

    if (sortDirectionParam) {
      options.sortDirection = sortDirectionParam;
    }

    // Get paginated downline with options
    const genealogyData = await getPaginatedDownline(
      targetUserId,
      maxLevel,
      page,
      pageSize,
      options
    );

    // Format the response
    const genealogyTree = {
      ...genealogyData.user,
      children: genealogyData.downline,
      pagination: genealogyData.pagination,
      metadata: genealogyData.metadata,
    };

    // Calculate statistics if requested
    let statistics = null;
    if (includeStats) {
      // Fetch all statistics in parallel for better performance
      const [
        levelCounts,
        downlineBalanceResult,
        rankDistribution,
        ranks
      ] = await Promise.all([
        // Get level counts
        getDownlineLevelCounts(targetUserId, maxLevel),

        // Calculate total wallet balance of downline users with a single aggregation query
        prisma.$queryRaw`
          SELECT SUM(walletBalance) as totalBalance
          FROM User
          WHERE uplineId = ${targetUserId}
        `,

        // Get rank distribution
        prisma.user.groupBy({
          by: ['rankId'],
          where: {
            uplineId: targetUserId,
          },
          _count: {
            id: true,
          },
        }),

        // Get ranks to map IDs to names
        prisma.rank.findMany({
          select: {
            id: true,
            name: true
          },
          cacheStrategy: { ttl: 60 * 60 * 1000 } // Cache for 1 hour
        })
      ]);

      // Calculate total users
      const totalUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0) + 1; // +1 for the root user

      // Get direct downline count
      const directDownlineCount = levelCounts[1] || 0;

      // Extract total balance from the raw query result
      const totalDownlineBalance = downlineBalanceResult[0]?.totalBalance || 0;

      // Create a map of rank IDs to names
      const rankMap = new Map(ranks.map(rank => [rank.id, rank.name]));

      // Format rank distribution
      const formattedRankDistribution = rankDistribution.map(item => ({
        rankId: item.rankId,
        rankName: rankMap.get(item.rankId) || 'Unknown',
        count: item._count.id,
      }));

      statistics = {
        totalUsers,
        levelCounts,
        totalDownlineBalance,
        directDownlineCount,
        rankDistribution: formattedRankDistribution,
        lastUpdated: new Date(),
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
