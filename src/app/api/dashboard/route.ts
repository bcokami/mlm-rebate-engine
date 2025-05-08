import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import serverCache from "@/lib/serverCache";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view dashboard data" },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "month";

    // Create a cache key based on the user email and timeframe
    const cacheKey = `dashboard:${userEmail}:${timeframe}`;

    // Try to get from cache first (5 minute TTL)
    return await serverCache.getOrSet(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: {
            id: true,
            name: true,
            email: true,
            walletBalance: true,
            rankId: true,
            rank: {
              select: {
                name: true,
                level: true
              }
            },
            profileImage: true
          },
        });

        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        const userId = user.id;

        // Determine date range based on timeframe
        const now = new Date();
        let startDate = new Date();

        if (timeframe === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (timeframe === "month") {
          startDate.setMonth(now.getMonth() - 1);
        } else if (timeframe === "year") {
          startDate.setFullYear(now.getFullYear() - 1);
        }

        // Fetch all data in parallel using Promise.all
        const [
          rebates,
          purchases,
          downlineUsers,
          rankDistribution,
          recentRebates,
          ranks
        ] = await Promise.all([
          // Get rebates
          prisma.rebate.findMany({
            where: {
              receiverId: userId,
              createdAt: {
                gte: startDate
              }
            },
            include: {
              generator: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: "desc"
            }
          }),

          // Get purchases
          prisma.purchase.findMany({
            where: {
              userId,
              createdAt: {
                gte: startDate
              }
            },
            include: {
              product: true
            },
            orderBy: {
              createdAt: "desc"
            }
          }),

          // Get downline users (direct children only for count)
          prisma.user.findMany({
            where: {
              uplineId: userId
            },
            select: {
              id: true,
              name: true,
              rankId: true,
              rank: {
                select: {
                  name: true
                }
              },
              createdAt: true
            }
          }),

          // Get rank distribution
          prisma.user.groupBy({
            by: ['rankId'],
            where: {
              uplineId: userId
            },
            _count: {
              id: true
            }
          }),

          // Get recent rebates (top 5)
          prisma.rebate.findMany({
            where: {
              receiverId: userId
            },
            include: {
              generator: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 5
          }),

          // Get ranks to map IDs to names
          prisma.rank.findMany()
        ]);

        // Calculate statistics
        const totalRebates = rebates.reduce((sum, rebate) => sum + rebate.amount, 0);
        const downlineCount = downlineUsers.length;
        const purchaseCount = purchases.length;

        // Create a map of rank IDs to names
        const rankMap = new Map(ranks.map(rank => [rank.id, rank.name]));

        // Format rank distribution
        const formattedRankDistribution = rankDistribution.reduce((acc, item) => {
          const rankName = rankMap.get(item.rankId) || 'Unknown';
          acc[rankName] = item._count.id;
          return acc;
        }, {} as Record<string, number>);

        // Prepare time series data for charts
        const rebateTimeSeriesData = prepareTimeSeriesData(rebates, timeframe, 'amount');
        const salesTimeSeriesData = prepareTimeSeriesData(purchases, timeframe, 'totalAmount');

        return NextResponse.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            rank: user.rank?.name || 'Distributor',
            rankLevel: user.rank?.level || 1,
            profileImage: user.profileImage
          },
          stats: {
            walletBalance: user.walletBalance || 0,
            totalRebates,
            downlineCount,
            purchaseCount
          },
          charts: {
            rebates: rebateTimeSeriesData,
            sales: salesTimeSeriesData,
            rankDistribution: formattedRankDistribution
          },
          recentData: {
            rebates: recentRebates,
            purchases: purchases.slice(0, 5)
          }
        });
      },
      5 * 60 * 1000 // 5 minute cache
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Helper function to prepare time series data for charts
function prepareTimeSeriesData(data: any[], timeframe: string, valueField: string) {
  const now = new Date();
  const result: Record<string, number> = {};

  if (timeframe === 'week') {
    // Initialize days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayName = days[date.getDay()];
      result[dayName] = 0;
    }

    // Aggregate data by day
    data.forEach(item => {
      const date = new Date(item.createdAt);
      const dayName = days[date.getDay()];
      result[dayName] += item[valueField];
    });
  } else if (timeframe === 'month') {
    // Initialize days of the month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      result[i.toString()] = 0;
    }

    // Aggregate data by day of month
    data.forEach(item => {
      const date = new Date(item.createdAt);
      const dayOfMonth = date.getDate().toString();
      result[dayOfMonth] = (result[dayOfMonth] || 0) + item[valueField];
    });
  } else if (timeframe === 'year') {
    // Initialize months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      result[month] = 0;
    });

    // Aggregate data by month
    data.forEach(item => {
      const date = new Date(item.createdAt);
      const monthName = months[date.getMonth()];
      result[monthName] += item[valueField];
    });
  }

  return result;
}
