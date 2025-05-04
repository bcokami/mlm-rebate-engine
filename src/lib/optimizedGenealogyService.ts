import { prisma } from "./prisma";
import { genealogyRedisCache } from "./redisCache";
import { config } from "@/env";
import { performance } from "perf_hooks";

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
  metadata?: Record<string, any>;
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
 * Interface for pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface for genealogy query options
 */
export interface GenealogyQueryOptions {
  filterRank?: number;
  filterMinSales?: number;
  filterMaxSales?: number;
  filterJoinedAfter?: Date;
  filterJoinedBefore?: Date;
  sortBy?: 'name' | 'createdAt' | 'rank' | 'downlineCount' | 'sales';
  sortDirection?: 'asc' | 'desc';
  includePerformanceMetrics?: boolean;
  lazyLoadLevels?: boolean;
  includeMetadata?: boolean;
  cursor?: string;
  batchSize?: number;
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
export async function getOptimizedDownline(
  userId: number,
  maxLevel: number = config.maxGenealogyDepth,
  page: number = 1,
  pageSize: number = 10,
  options: GenealogyQueryOptions = {}
) {
  // Start performance measurement
  const startTime = performance.now();
  
  // Create a cache key based on the parameters
  const cacheKey = `downline:${userId}:${maxLevel}:${page}:${pageSize}:${JSON.stringify(options)}`;
  
  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async () => {
    // Get the user with a single query
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        metadata: true,
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
          // This is now supported with a subquery in SQL
          orderBy = { downline: { _count: direction } };
          break;
        case 'sales':
          // This would require a more complex query with aggregation
          orderBy = { createdAt: direction };
          break;
        default:
          orderBy = { createdAt: direction };
      }
    }

    // Get direct downline with pagination using a single efficient query
    const [directDownline, totalDirectDownline] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          rankId: true,
          walletBalance: true,
          createdAt: true,
          metadata: true,
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
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalDirectDownline / pageSize);

    // For each direct downline member, get their downline recursively up to maxLevel - 1
    const directDownlineWithChildren = [];

    // If lazyLoadLevels is true, we'll only load the first level of children
    // and provide a function to load deeper levels on demand
    const initialDepthToLoad = options.lazyLoadLevels ? 1 : maxLevel - 1;

    // Use batch processing for better performance
    const batchSize = options.batchSize || config.batchSize;
    const batches = [];
    
    for (let i = 0; i < directDownline.length; i += batchSize) {
      batches.push(directDownline.slice(i, i + batchSize));
    }

    // Process each batch
    for (const batch of batches) {
      const batchPromises = batch.map(async (downlineMember) => {
        const children = maxLevel > 1 && initialDepthToLoad > 0
          ? await getDownlineRecursiveBatch(downlineMember.id, 2, initialDepthToLoad + 1)
          : [];

        // Add performance metrics if requested
        let performanceMetrics = null;
        if (options.includePerformanceMetrics) {
          performanceMetrics = await getOptimizedUserPerformanceMetrics(downlineMember.id);
        }

        return {
          ...downlineMember,
          level: 1,
          children,
          performanceMetrics,
          hasMoreChildren: maxLevel > initialDepthToLoad + 1 && downlineMember._count.downline > 0,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      directDownlineWithChildren.push(...batchResults);
    }

    // Add performance metrics for the root user if requested
    let userPerformanceMetrics = null;
    if (options.includePerformanceMetrics) {
      userPerformanceMetrics = await getOptimizedUserPerformanceMetrics(userId);
    }

    // Calculate pagination metadata
    const paginationMetadata: PaginationMetadata = {
      page,
      pageSize,
      totalItems: totalDirectDownline,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    // End performance measurement
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return {
      user: {
        ...user,
        level: 0,
        performanceMetrics: userPerformanceMetrics,
      },
      downline: directDownlineWithChildren,
      pagination: paginationMetadata,
      // Add metadata about the query
      metadata: {
        maxLevel,
        initialDepthLoaded: initialDepthToLoad,
        lazyLoading: options.lazyLoadLevels || false,
        executionTime: executionTime.toFixed(2) + 'ms',
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
  }, config.cacheTTL); // Use configured cache TTL
}

/**
 * Recursively get a user's downline up to a maximum level using batch processing
 * This function uses a more efficient approach for deep trees
 *
 * @param userId The ID of the user whose downline to fetch
 * @param currentLevel Current level in the recursion
 * @param maxLevel Maximum depth to fetch
 * @returns Downline structure
 */
async function getDownlineRecursiveBatch(
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
  return await genealogyRedisCache.getOrSet(cacheKey, async (): Promise<GenealogyUser[]> => {
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
        metadata: true,
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

    // Use batch processing for better performance
    const batchSize = config.batchSize;
    const batches = [];
    
    for (let i = 0; i < directDownline.length; i += batchSize) {
      batches.push(directDownline.slice(i, i + batchSize));
    }

    // Process each batch
    const result: GenealogyUser[] = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (downlineMember) => {
        const children: GenealogyUser[] = currentLevel < maxLevel
          ? await getDownlineRecursiveBatch(downlineMember.id, currentLevel + 1, maxLevel)
          : [];

        return {
          ...downlineMember,
          level: currentLevel,
          children: children.length > 0 ? children : undefined,
        };
      });

      const batchResults = await Promise.all(batchPromises);
      result.push(...batchResults);
    }

    return result;
  }, config.cacheTTL); // Use configured cache TTL
}

/**
 * Get the entire downline of a user (all levels) using a more efficient approach
 * This uses a breadth-first approach with batching to avoid deep recursion
 *
 * @param userId The ID of the user whose downline to fetch
 * @returns Array of user IDs in the downline
 */
export async function getOptimizedDownlineIds(userId: number): Promise<number[]> {
  // Create a cache key
  const cacheKey = `downlineIds:${userId}`;

  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async (): Promise<number[]> => {
    const result: number[] = [];
    let currentLevelIds = [userId];
    const batchSize = config.batchSize;

    while (currentLevelIds.length > 0) {
      // Process in batches for better performance
      const batches = [];
      
      for (let i = 0; i < currentLevelIds.length; i += batchSize) {
        batches.push(currentLevelIds.slice(i, i + batchSize));
      }

      const nextLevelIds: number[] = [];
      
      for (const batch of batches) {
        // Get all direct downline of the current batch
        const nextLevel = await prisma.user.findMany({
          where: {
            uplineId: {
              in: batch,
            },
          },
          select: {
            id: true,
          },
        });

        const batchNextLevelIds = nextLevel.map(user => user.id);
        nextLevelIds.push(...batchNextLevelIds);
      }

      if (nextLevelIds.length === 0) {
        break;
      }

      // Add to result, excluding the original user
      result.push(...nextLevelIds.filter(id => id !== userId));

      // Move to the next level
      currentLevelIds = nextLevelIds;
    }

    return result;
  }, config.cacheTTL * 2); // Cache for longer since this is expensive
}

/**
 * Get the count of users at each level in a user's downline using an optimized approach
 *
 * @param userId The ID of the user whose downline to analyze
 * @param maxLevel Maximum depth to analyze
 * @returns Object with counts by level
 */
export async function getOptimizedDownlineLevelCounts(
  userId: number,
  maxLevel: number = config.maxGenealogyDepth
): Promise<Record<number, number>> {
  // Create a cache key
  const cacheKey = `levelCounts:${userId}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async (): Promise<Record<number, number>> => {
    const counts: Record<number, number> = {};
    let currentLevelIds = [userId];
    let currentLevel = 1;
    const batchSize = config.batchSize;

    while (currentLevelIds.length > 0 && currentLevel <= maxLevel) {
      // Process in batches for better performance
      const batches = [];
      
      for (let i = 0; i < currentLevelIds.length; i += batchSize) {
        batches.push(currentLevelIds.slice(i, i + batchSize));
      }

      const nextLevelIds: number[] = [];
      
      for (const batch of batches) {
        // Get all direct downline of the current batch
        const nextLevel = await prisma.user.findMany({
          where: {
            uplineId: {
              in: batch,
            },
          },
          select: {
            id: true,
          },
        });

        const batchNextLevelIds = nextLevel.map(user => user.id);
        nextLevelIds.push(...batchNextLevelIds);
      }

      if (nextLevelIds.length === 0) {
        break;
      }

      // Store the count for this level
      counts[currentLevel] = nextLevelIds.length;

      // Move to the next level
      currentLevelIds = nextLevelIds;
      currentLevel++;
    }

    return counts;
  }, config.cacheTTL); // Use configured cache TTL
}

/**
 * Get performance metrics for a user using optimized queries
 *
 * @param userId The ID of the user to get metrics for
 * @returns Performance metrics object
 */
export async function getOptimizedUserPerformanceMetrics(userId: number): Promise<UserPerformanceMetrics> {
  // Create a cache key
  const cacheKey = `metrics:${userId}`;

  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async (): Promise<UserPerformanceMetrics> => {
    // Get the user's downline IDs
    const downlineIds = await getOptimizedDownlineIds(userId);
    
    // Use a single transaction for all queries to ensure consistency
    const [
      personalSalesData,
      teamSalesData,
      rebatesData,
      rankHistory,
      newTeamMembersCount
    ] = await prisma.$transaction([
      // Personal sales
      prisma.purchase.aggregate({
        where: {
          userId: userId,
          status: 'completed',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      
      // Team sales (if downline exists)
      downlineIds.length > 0 ? prisma.purchase.aggregate({
        where: {
          userId: {
            in: downlineIds,
          },
          status: 'completed',
        },
        _sum: {
          totalAmount: true,
        },
      }) : Promise.resolve({ _sum: { totalAmount: null } }),
      
      // Rebates earned
      prisma.rebate.aggregate({
        where: {
          receiverId: userId,
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Rank advancement history
      prisma.rankAdvancement.findMany({
        where: {
          userId: userId,
        },
        select: {
          newRankId: true,
          createdAt: true,
          newRank: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // New team members in the last 30 days
      prisma.user.count({
        where: {
          id: {
            in: downlineIds,
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);
    
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
    
    // Format rank history
    const formattedRankHistory = rankHistory.map(history => ({
      rankId: history.newRankId,
      rankName: history.newRank.name,
      achievedAt: history.createdAt,
    }));
    
    // If no rank history, add the current rank
    if (formattedRankHistory.length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          rankId: true,
          rank: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
      });
      
      if (user) {
        formattedRankHistory.push({
          rankId: user.rankId,
          rankName: user.rank.name,
          achievedAt: user.createdAt,
        });
      }
    }
    
    return {
      personalSales: personalSalesData._sum.totalAmount || 0,
      teamSales: teamSalesData._sum.totalAmount || 0,
      totalSales: (personalSalesData._sum.totalAmount || 0) + (teamSalesData._sum.totalAmount || 0),
      rebatesEarned: rebatesData._sum.amount || 0,
      teamSize: downlineIds.length,
      newTeamMembers: newTeamMembersCount,
      rankHistory: formattedRankHistory,
      activityScore,
      lastUpdated: new Date(),
    };
  }, config.cacheTTL); // Use configured cache TTL
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
    executionTime?: string;
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
export async function loadOptimizedAdditionalLevels(
  userId: number,
  currentLevel: number,
  maxLevel: number
): Promise<AdditionalLevelsResponse> {
  // Start performance measurement
  const startTime = performance.now();
  
  // Create a cache key
  const cacheKey = `additionalLevels:${userId}:${currentLevel}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async (): Promise<AdditionalLevelsResponse> => {
    // Get the children using the batch method
    const children = await getDownlineRecursiveBatch(userId, currentLevel + 1, maxLevel);
    
    // End performance measurement
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return {
      children,
      metadata: {
        userId,
        currentLevel,
        maxLevel,
        loadedAt: new Date(),
        executionTime: executionTime.toFixed(2) + 'ms',
      },
    };
  }, config.cacheTTL); // Use configured cache TTL
}

/**
 * Get statistics about a user's downline
 * 
 * @param userId The ID of the user whose downline to analyze
 * @param maxLevel Maximum depth to analyze
 * @returns Statistics object
 */
export async function getOptimizedDownlineStatistics(
  userId: number,
  maxLevel: number = config.maxGenealogyDepth
) {
  // Create a cache key
  const cacheKey = `statistics:${userId}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyRedisCache.getOrSet(cacheKey, async () => {
    // Get level counts
    const levelCounts = await getOptimizedDownlineLevelCounts(userId, maxLevel);

    // Calculate total users
    const totalUsers = Object.values(levelCounts).reduce((sum, count) => sum + count, 0) + 1; // +1 for the root user

    // Get direct downline count
    const directDownlineCount = levelCounts[1] || 0;

    // Get downline IDs
    const downlineIds = await getOptimizedDownlineIds(userId);

    // Calculate total wallet balance of downline users in a single query
    const walletBalanceSum = await prisma.user.aggregate({
      where: {
        id: {
          in: downlineIds,
        },
      },
      _sum: {
        walletBalance: true,
      },
    });

    const totalDownlineBalance = walletBalanceSum._sum.walletBalance || 0;

    // Get rank distribution in a single query
    const rankDistribution = await prisma.user.groupBy({
      by: ['rankId'],
      where: {
        id: {
          in: downlineIds,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get ranks to map IDs to names
    const ranks = await prisma.rank.findMany();
    const rankMap = new Map(ranks.map(rank => [rank.id, rank.name]));

    // Format rank distribution
    const formattedRankDistribution = rankDistribution.map(item => ({
      rankId: item.rankId,
      rankName: rankMap.get(item.rankId) || 'Unknown',
      count: item._count.id,
    }));

    // Get activity metrics
    const activeUsersLast30Days = await prisma.purchase.groupBy({
      by: ['userId'],
      where: {
        userId: {
          in: downlineIds,
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const activeUserCount = activeUsersLast30Days.length;
    const activeUserPercentage = totalUsers > 1 ? (activeUserCount / (totalUsers - 1)) * 100 : 0;

    return {
      totalUsers,
      levelCounts,
      totalDownlineBalance,
      directDownlineCount,
      rankDistribution: formattedRankDistribution,
      activity: {
        activeUsersLast30Days: activeUserCount,
        activeUserPercentage: Math.round(activeUserPercentage * 100) / 100,
      },
      lastUpdated: new Date(),
    };
  }, config.cacheTTL); // Use configured cache TTL
}

/**
 * Warm up the cache for frequently accessed genealogy data
 * This can be called periodically to ensure fast responses
 * 
 * @param userIds Array of user IDs to warm cache for
 */
export async function warmGenealogyCache(userIds: number[]) {
  const batchSize = config.batchSize;
  const batches = [];
  
  for (let i = 0; i < userIds.length; i += batchSize) {
    batches.push(userIds.slice(i, i + batchSize));
  }
  
  for (const batch of userIds) {
    const promises = batch.map(async (userId) => {
      // Warm up first level of genealogy
      await getOptimizedDownline(userId, 2, 1, 10, { lazyLoadLevels: true });
      
      // Warm up statistics
      await getOptimizedDownlineStatistics(userId);
      
      // Warm up performance metrics
      await getOptimizedUserPerformanceMetrics(userId);
    });
    
    await Promise.all(promises);
  }
}

/**
 * Clear the genealogy cache for a specific user
 * This should be called when a user's downline changes
 * 
 * @param userId The ID of the user whose cache to clear
 */
export async function clearUserGenealogyCache(userId: number) {
  // Create a pattern to match all keys for this user
  const pattern = `genealogy:*${userId}*`;
  
  // Clear all matching keys
  await genealogyRedisCache.clearNamespace();
}
