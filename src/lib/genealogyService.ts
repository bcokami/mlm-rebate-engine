import { prisma } from "./prisma";
import { genealogyCache } from "./cache";

/**
 * Interface for genealogy user data
 */
export interface GenealogyUser {
  id: number;
  name: string;
  email: string;
  rankId: number;
  rank: {
    id?: number;
    name: string;
  };
  level: number;
  walletBalance?: number;
  createdAt?: Date;
  _count: {
    downline: number;
  };
  children?: GenealogyUser[];
  performanceMetrics?: UserPerformanceMetrics | null;
  hasMoreChildren?: boolean;
}

/**
 * Interface for user performance metrics
 */
export interface UserPerformanceMetrics {
  personalSales: number;
  teamSales: number;
  totalSales: number;
  rebatesEarned: number;
  teamSize: number;
  newTeamMembers: number;
  rankHistory: {
    rankId: number;
    rankName: string;
    achievedAt: Date;
  }[];
  activityScore: number;
  lastUpdated: Date;
}

/**
 * Get a user's downline with pagination and optimized queries
 *
 * @param userId The ID of the user whose downline to fetch
 * @param maxLevel Maximum depth of downline to fetch (default: 10)
 * @param page Page number for pagination (default: 1)
 * @param pageSize Number of direct downline members per page (default: 10)
 * @param options Additional options for filtering and performance
 * @returns Paginated downline structure
 */
export async function getPaginatedDownline(
  userId: number,
  maxLevel: number = 10,
  page: number = 1,
  pageSize: number = 10,
  options: {
    filterRank?: number;
    filterMinSales?: number;
    filterMaxSales?: number;
    filterJoinedAfter?: Date;
    filterJoinedBefore?: Date;
    sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount' | 'sales';
    sortDirection?: 'asc' | 'desc';
    includePerformanceMetrics?: boolean;
    lazyLoadLevels?: boolean;
  } = {}
) {
  // Create a cache key based on the parameters
  const cacheKey = `downline:${userId}:${maxLevel}:${page}:${pageSize}:${JSON.stringify(options)}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async () => {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            downline: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    let whereClause: any = { uplineId: userId };

    if (options.filterRank) {
      whereClause.rankId = options.filterRank;
    }

    if (options.filterJoinedAfter || options.filterJoinedBefore) {
      whereClause.createdAt = {};

      if (options.filterJoinedAfter) {
        whereClause.createdAt.gte = options.filterJoinedAfter;
      }

      if (options.filterJoinedBefore) {
        whereClause.createdAt.lte = options.filterJoinedBefore;
      }
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };

    if (options.sortBy) {
      const direction = options.sortDirection || 'desc';

      switch (options.sortBy) {
        case 'name':
          orderBy = { name: direction };
          break;
        case 'rank':
          orderBy = { rankId: direction };
          break;
        case 'downlineCount':
          // This requires a more complex query with aggregation
          // For simplicity, we'll stick with createdAt for now
          orderBy = { createdAt: direction };
          break;
        case 'sales':
          // This requires a more complex query with aggregation
          // For simplicity, we'll stick with createdAt for now
          orderBy = { createdAt: direction };
          break;
        default:
          orderBy = { createdAt: direction };
      }
    }

    // Get direct downline with pagination
    const directDownline = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            downline: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy,
    });

    // Get total count for pagination
    const totalDirectDownline = await prisma.user.count({
      where: whereClause,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalDirectDownline / pageSize);

    // For each direct downline member, get their downline recursively up to maxLevel - 1
    const directDownlineWithChildren = [];

    // If lazyLoadLevels is true, we'll only load the first level of children
    // and provide a function to load deeper levels on demand
    const initialDepthToLoad = options.lazyLoadLevels ? 1 : maxLevel - 1;

    for (const downlineMember of directDownline) {
      const children = maxLevel > 1 && initialDepthToLoad > 0
        ? await getDownlineRecursive(downlineMember.id, 2, initialDepthToLoad + 1)
        : [];

      // Add performance metrics if requested
      let performanceMetrics = null;
      if (options.includePerformanceMetrics) {
        performanceMetrics = await getUserPerformanceMetrics(downlineMember.id);
      }

      directDownlineWithChildren.push({
        ...downlineMember,
        level: 1,
        children,
        performanceMetrics,
        hasMoreChildren: maxLevel > initialDepthToLoad + 1 && downlineMember._count.downline > 0,
      });
    }

    // Add performance metrics for the root user if requested
    let userPerformanceMetrics = null;
    if (options.includePerformanceMetrics) {
      userPerformanceMetrics = await getUserPerformanceMetrics(userId);
    }

    return {
      user: {
        ...user,
        level: 0,
        performanceMetrics: userPerformanceMetrics,
      },
      downline: directDownlineWithChildren,
      pagination: {
        page,
        pageSize,
        totalItems: totalDirectDownline,
        totalPages,
      },
      // Add metadata about the query
      metadata: {
        maxLevel,
        initialDepthLoaded: initialDepthToLoad,
        lazyLoading: options.lazyLoadLevels || false,
        filters: {
          rank: options.filterRank,
          joinedAfter: options.filterJoinedAfter,
          joinedBefore: options.filterJoinedBefore,
        },
        sorting: {
          by: options.sortBy || 'createdAt',
          direction: options.sortDirection || 'desc',
        },
      },
    };
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Recursively get a user's downline up to a maximum level
 * This function uses a more efficient approach for deep trees
 *
 * @param userId The ID of the user whose downline to fetch
 * @param currentLevel Current level in the recursion
 * @param maxLevel Maximum depth to fetch
 * @returns Downline structure
 */
async function getDownlineRecursive(
  userId: number,
  currentLevel: number,
  maxLevel: number
): Promise<GenealogyUser[]> {
  if (currentLevel > maxLevel) {
    return [];
  }

  // Create a cache key
  const cacheKey = `recursive:${userId}:${currentLevel}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async (): Promise<GenealogyUser[]> => {
    // Get direct downline
    const directDownline = await prisma.user.findMany({
      where: { uplineId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        rank: {
          select: {
            id: true,
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
        createdAt: 'desc',
      },
    });

    // For each direct downline member, get their downline recursively
    const result: GenealogyUser[] = [];

    for (const downlineMember of directDownline) {
      const children: GenealogyUser[] = currentLevel < maxLevel
        ? await getDownlineRecursive(downlineMember.id, currentLevel + 1, maxLevel)
        : [];

      result.push({
        ...downlineMember,
        level: currentLevel,
        children: children.length > 0 ? children : undefined,
      });
    }

    return result;
  }, 5 * 60 * 1000); // Cache for 5 minutes
}

/**
 * Get the entire downline of a user (all levels) using a more efficient approach
 * This uses a breadth-first approach to avoid deep recursion
 *
 * @param userId The ID of the user whose downline to fetch
 * @returns Array of user IDs in the downline
 */
export async function getEntireDownlineIds(userId: number): Promise<number[]> {
  const result: number[] = [];
  let currentLevelIds = [userId];

  while (currentLevelIds.length > 0) {
    // Get all direct downline of the current level
    const nextLevel = await prisma.user.findMany({
      where: {
        uplineId: {
          in: currentLevelIds,
        },
      },
      select: {
        id: true,
      },
    });

    const nextLevelIds = nextLevel.map(user => user.id);

    if (nextLevelIds.length === 0) {
      break;
    }

    // Add to result, excluding the original user
    result.push(...nextLevelIds);

    // Move to the next level
    currentLevelIds = nextLevelIds;
  }

  return result;
}

/**
 * Get the count of users at each level in a user's downline
 *
 * @param userId The ID of the user whose downline to analyze
 * @param maxLevel Maximum depth to analyze
 * @returns Object with counts by level
 */
export async function getDownlineLevelCounts(
  userId: number,
  maxLevel: number = 10
): Promise<Record<number, number>> {
  // Create a cache key
  const cacheKey = `levelCounts:${userId}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async (): Promise<Record<number, number>> => {
    const counts: Record<number, number> = {};

    // Use a more efficient approach with a recursive CTE (Common Table Expression)
    // This avoids multiple round trips to the database
    const result = await prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        -- Base case: direct downline of the user
        SELECT id, 1 AS level
        FROM User
        WHERE uplineId = ${userId}

        UNION ALL

        -- Recursive case: downline of downline
        SELECT u.id, d.level + 1
        FROM User u
        JOIN downline d ON u.uplineId = d.id
        WHERE d.level < ${maxLevel}
      )
      -- Count users at each level
      SELECT level, COUNT(*) as count
      FROM downline
      GROUP BY level
      ORDER BY level
    `;

    // Format the result
    for (const row of result as any[]) {
      counts[row.level] = Number(row.count);
    }

    return counts;
  }, 10 * 60 * 1000); // Cache for 10 minutes
}

/**
 * Get performance metrics for a user
 *
 * @param userId The ID of the user to get metrics for
 * @returns Performance metrics object
 */
export async function getUserPerformanceMetrics(userId: number): Promise<UserPerformanceMetrics> {
  // Create a cache key
  const cacheKey = `metrics:${userId}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async (): Promise<UserPerformanceMetrics> => {
    // Get downline IDs for team calculations
    const downlineIdsQuery = prisma.$queryRaw`
      WITH RECURSIVE downline AS (
        -- Base case: direct downline of the user
        SELECT id
        FROM User
        WHERE uplineId = ${userId}

        UNION ALL

        -- Recursive case: downline of downline
        SELECT u.id
        FROM User u
        JOIN downline d ON u.uplineId = d.id
      )
      SELECT id FROM downline
    `;

    // Calculate date ranges for recent metrics
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Run all queries in parallel for better performance
    const [
      downlineIds,
      personalSalesResult,
      rebatesEarnedResult,
      newTeamMembersResult,
      rankHistoryResult
    ] = await Promise.all([
      // Get all downline IDs
      downlineIdsQuery,

      // Get personal sales
      prisma.purchase.aggregate({
        where: {
          userId: userId,
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Get rebates earned
      prisma.rebate.aggregate({
        where: {
          receiverId: userId,
        },
        _sum: {
          amount: true,
        },
      }),

      // Get new team members in the last month
      prisma.user.count({
        where: {
          uplineId: userId,
          createdAt: {
            gte: oneMonthAgo,
          },
        },
      }),

      // Get rank history (mock data for now)
      Promise.resolve([
        {
          rankId: 1,
          rank: { name: 'Starter' },
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        },
        {
          rankId: 2,
          rank: { name: 'Bronze' },
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        },
        {
          rankId: 3,
          rank: { name: 'Silver' },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      ])
    ]);

    // Get team sales using the downline IDs
    const teamSalesResult = await prisma.purchase.aggregate({
      where: {
        userId: {
          in: (downlineIds as any[]).map(row => row.id),
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Extract values from results
    const personalSales = personalSalesResult._sum.totalAmount || 0;
    const teamSales = teamSalesResult._sum.totalAmount || 0;
    const rebatesEarned = rebatesEarnedResult._sum.amount || 0;
    const teamSize = (downlineIds as any[]).length;
    const newTeamMembers = newTeamMembersResult;

    // Calculate activity score based on real metrics
    // Higher score for more sales, rebates, and team growth
    const activityScore = Math.min(100, Math.floor(
      (personalSales / 1000 * 20) + // 20% weight for personal sales
      (teamSales / 5000 * 30) + // 30% weight for team sales
      (rebatesEarned / 500 * 20) + // 20% weight for rebates
      (newTeamMembers / 5 * 30) // 30% weight for team growth
    ));

    return {
      personalSales,
      teamSales,
      totalSales: personalSales + teamSales,
      rebatesEarned,
      teamSize,
      newTeamMembers,
      rankHistory: rankHistoryResult.map(history => ({
        rankId: history.rankId,
        rankName: history.rank.name,
        achievedAt: history.createdAt,
      })),
      activityScore,
      lastUpdated: new Date(),
    };
  }, 15 * 60 * 1000); // Cache for 15 minutes
}

/**
 * Interface for additional levels response
 */
export interface AdditionalLevelsResponse {
  children: GenealogyUser[];
  metadata: {
    userId: number;
    currentLevel: number;
    maxLevel: number;
    loadedAt: Date;
  };
}

/**
 * Load additional levels for a specific user in the genealogy tree
 * This is used for lazy loading deeper levels on demand
 *
 * @param userId The ID of the user whose children to load
 * @param currentLevel The current level of the user
 * @param maxLevel Maximum depth to load
 * @returns Children nodes with their descendants
 */
export async function loadAdditionalLevels(
  userId: number,
  currentLevel: number,
  maxLevel: number
): Promise<AdditionalLevelsResponse> {
  // Create a cache key
  const cacheKey = `additionalLevels:${userId}:${currentLevel}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async (): Promise<AdditionalLevelsResponse> => {
    // Get the children
    const children = await getDownlineRecursive(userId, currentLevel + 1, maxLevel);

    return {
      children,
      metadata: {
        userId,
        currentLevel,
        maxLevel,
        loadedAt: new Date(),
      },
    };
  }, 5 * 60 * 1000); // Cache for 5 minutes
}
