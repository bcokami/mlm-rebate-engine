import { prisma } from "./prisma";
import { genealogyCache } from "./cache";

/**
 * Get a user's downline with pagination and optimized queries
 *
 * @param userId The ID of the user whose downline to fetch
 * @param maxLevel Maximum depth of downline to fetch (default: 10)
 * @param page Page number for pagination (default: 1)
 * @param pageSize Number of direct downline members per page (default: 10)
 * @returns Paginated downline structure
 */
export async function getPaginatedDownline(
  userId: number,
  maxLevel: number = 10,
  page: number = 1,
  pageSize: number = 10
) {
  // Create a cache key based on the parameters
  const cacheKey = `downline:${userId}:${maxLevel}:${page}:${pageSize}`;

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
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get direct downline with pagination
    const directDownline = await prisma.user.findMany({
      where: { uplineId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
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
      skip,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const totalDirectDownline = await prisma.user.count({
      where: { uplineId: userId },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalDirectDownline / pageSize);

    // For each direct downline member, get their downline recursively up to maxLevel - 1
    const directDownlineWithChildren = [];

    for (const downlineMember of directDownline) {
      const children = maxLevel > 1
        ? await getDownlineRecursive(downlineMember.id, 2, maxLevel)
        : [];

      directDownlineWithChildren.push({
        ...downlineMember,
        level: 1,
        children,
      });
    }

    return {
      user: {
        ...user,
        level: 0,
      },
      downline: directDownlineWithChildren,
      pagination: {
        page,
        pageSize,
        totalItems: totalDirectDownline,
        totalPages,
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
) {
  if (currentLevel > maxLevel) {
    return [];
  }

  // Create a cache key
  const cacheKey = `recursive:${userId}:${currentLevel}:${maxLevel}`;

  // Try to get from cache first
  return await genealogyCache.getOrSet(cacheKey, async () => {
    // Get direct downline
    const directDownline = await prisma.user.findMany({
      where: { uplineId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
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
        createdAt: 'desc',
      },
    });

    // For each direct downline member, get their downline recursively
    const result = [];

    for (const downlineMember of directDownline) {
      const children = currentLevel < maxLevel
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
  const counts: Record<number, number> = {};
  let currentLevelIds = [userId];
  let currentLevel = 1;

  while (currentLevelIds.length > 0 && currentLevel <= maxLevel) {
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

    // Store the count for this level
    counts[currentLevel] = nextLevelIds.length;

    // Move to the next level
    currentLevelIds = nextLevelIds;
    currentLevel++;
  }

  return counts;
}
