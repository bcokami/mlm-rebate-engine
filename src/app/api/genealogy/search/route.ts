import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the search filters schema
const searchFiltersSchema = z.object({
  query: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  rankId: z.number().int().positive().optional(),
  minDownline: z.number().int().nonnegative().optional(),
  maxDownline: z.number().int().nonnegative().optional(),
  joinedAfter: z.string().optional(),
  joinedBefore: z.string().optional(),
  minWalletBalance: z.number().nonnegative().optional(),
  maxWalletBalance: z.number().nonnegative().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  includePerformanceMetrics: z.boolean().default(false),
});

/**
 * POST /api/genealogy/search
 * Search for users in the genealogy with advanced filters
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to search genealogy" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validationResult = searchFiltersSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const {
      query,
      name,
      email,
      rankId,
      minDownline,
      maxDownline,
      joinedAfter,
      joinedBefore,
      minWalletBalance,
      maxWalletBalance,
      page,
      pageSize,
      includePerformanceMetrics,
    } = validationResult.data;
    
    // Build where clause
    const where: any = {};
    
    // Add query filter (search by ID, name, or email)
    if (query) {
      const queryInt = parseInt(query);
      
      if (!isNaN(queryInt)) {
        // If query is a number, search by ID
        where.OR = [
          { id: queryInt },
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      } else {
        // Otherwise, search by name or email
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }
    }
    
    // Add name filter
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    
    // Add email filter
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }
    
    // Add rank filter
    if (rankId) {
      where.rankId = rankId;
    }
    
    // Add date range filters
    if (joinedAfter || joinedBefore) {
      where.createdAt = {};
      
      if (joinedAfter) {
        where.createdAt.gte = new Date(joinedAfter);
      }
      
      if (joinedBefore) {
        where.createdAt.lte = new Date(joinedBefore);
      }
    }
    
    // Add wallet balance range filters
    if (minWalletBalance !== undefined || maxWalletBalance !== undefined) {
      where.walletBalance = {};
      
      if (minWalletBalance !== undefined) {
        where.walletBalance.gte = minWalletBalance;
      }
      
      if (maxWalletBalance !== undefined) {
        where.walletBalance.lte = maxWalletBalance;
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        walletBalance: true,
        createdAt: true,
        uplineId: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Filter by downline count if specified
    let filteredUsers = users;
    
    if (minDownline !== undefined || maxDownline !== undefined) {
      filteredUsers = users.filter(user => {
        const downlineCount = user._count.downline;
        
        if (minDownline !== undefined && downlineCount < minDownline) {
          return false;
        }
        
        if (maxDownline !== undefined && downlineCount > maxDownline) {
          return false;
        }
        
        return true;
      });
    }
    
    // Get performance metrics if requested
    let usersWithMetrics = filteredUsers;
    
    if (includePerformanceMetrics) {
      const userIds = filteredUsers.map(user => user.id);
      
      // Get performance metrics for all users in a single batch
      const performanceMetrics = await Promise.all(
        userIds.map(async (userId) => {
          // Get personal sales
          const personalSales = await prisma.purchase.aggregate({
            where: {
              userId,
              status: 'completed',
            },
            _sum: {
              totalAmount: true,
            },
          });
          
          // Get downline IDs
          const downline = await prisma.user.findMany({
            where: {
              uplineId: userId,
            },
            select: {
              id: true,
            },
          });
          
          const downlineIds = downline.map(d => d.id);
          
          // Get team sales
          const teamSales = downlineIds.length > 0
            ? await prisma.purchase.aggregate({
                where: {
                  userId: {
                    in: downlineIds,
                  },
                  status: 'completed',
                },
                _sum: {
                  totalAmount: true,
                },
              })
            : { _sum: { totalAmount: null } };
          
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
          
          return {
            userId,
            personalSales: personalSales._sum.totalAmount || 0,
            teamSales: teamSales._sum.totalAmount || 0,
            totalSales: (personalSales._sum.totalAmount || 0) + (teamSales._sum.totalAmount || 0),
            rebatesEarned: rebatesEarned._sum.amount || 0,
            teamSize: downlineIds.length,
            newTeamMembers,
            lastUpdated: new Date(),
          };
        })
      );
      
      // Merge performance metrics with users
      usersWithMetrics = filteredUsers.map(user => {
        const metrics = performanceMetrics.find(m => m.userId === user.id);
        
        return {
          ...user,
          performanceMetrics: metrics || null,
        };
      });
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Return search results
    return NextResponse.json({
      users: usersWithMetrics,
      pagination: {
        page,
        pageSize,
        totalItems: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      metadata: {
        query,
        filters: {
          name,
          email,
          rankId,
          minDownline,
          maxDownline,
          joinedAfter,
          joinedBefore,
          minWalletBalance,
          maxWalletBalance,
        },
        includePerformanceMetrics,
      },
    });
  } catch (error) {
    console.error("Error searching genealogy:", error);
    
    return NextResponse.json(
      { error: "Failed to search genealogy" },
      { status: 500 }
    );
  }
}
