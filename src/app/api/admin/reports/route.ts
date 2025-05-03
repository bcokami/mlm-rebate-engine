import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // Check if the authenticated user is an admin
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, rankId: true },
    });
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }
    
    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    if (authenticatedUser.rankId !== 6) {
      return NextResponse.json(
        { error: "You do not have permission to access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate") as string) 
      : new Date(new Date().setDate(new Date().getDate() - 30));
    
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate") as string) 
      : new Date();
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Get sales by product
    const salesByProduct = await prisma.purchase.groupBy({
      by: ["productId"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get product names
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: salesByProduct.map((sale) => sale.productId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Map product IDs to names
    const productMap = products.reduce((map, product) => {
      map[product.id] = product.name;
      return map;
    }, {} as Record<number, string>);

    // Format sales by product data
    const salesByProductData = {
      labels: salesByProduct.map((sale) => productMap[sale.productId] || `Product ${sale.productId}`),
      data: salesByProduct.map((sale) => sale._sum.totalAmount || 0),
    };

    // Get sales by date (monthly for the selected period)
    const salesByDate = await getSalesByDate(startDate, endDate);

    // Get rebates by level
    const rebatesByLevel = await prisma.rebate.groupBy({
      by: ["level"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Format rebates by level data
    const rebatesByLevelData = {
      labels: rebatesByLevel.map((rebate) => `Level ${rebate.level}`),
      data: rebatesByLevel.map((rebate) => rebate._sum.amount || 0),
    };

    // Get users by rank
    const usersByRank = await prisma.user.groupBy({
      by: ["rankId"],
      _count: {
        id: true,
      },
    });

    // Get rank names
    const ranks = await prisma.rank.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Map rank IDs to names
    const rankMap = ranks.reduce((map, rank) => {
      map[rank.id] = rank.name;
      return map;
    }, {} as Record<number, string>);

    // Format users by rank data
    const usersByRankData = {
      labels: usersByRank.map((user) => rankMap[user.rankId] || `Rank ${user.rankId}`),
      data: usersByRank.map((user) => user._count.id),
    };

    // Get top earners
    const topEarners = await prisma.user.findMany({
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
        _sum: {
          walletBalance: true,
        },
      },
      orderBy: {
        walletBalance: "desc",
      },
      take: 5,
    });

    // Format top earners data
    const topEarnersData = topEarners.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      totalRebates: user._sum.walletBalance || 0,
      rank: user.rank.name,
    }));

    // Get top recruiters
    const topRecruiters = await prisma.user.findMany({
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
          downline: true,
        },
      },
      orderBy: {
        downline: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Format top recruiters data
    const topRecruitersData = topRecruiters.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      directDownlineCount: user._count.downline,
      rank: user.rank.name,
    }));

    // Get summary data
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    
    const totalSalesResult = await prisma.purchase.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });
    
    const totalSales = totalSalesResult._sum.totalAmount || 0;
    const totalPurchases = totalSalesResult._count.id || 0;
    
    const totalRebatesResult = await prisma.rebate.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });
    
    const totalRebates = totalRebatesResult._sum.amount || 0;
    
    const averageOrderValue = totalPurchases > 0 ? totalSales / totalPurchases : 0;
    
    // Calculate conversion rate (purchases / user visits)
    // For simplicity, we'll use a mock value here
    const conversionRate = 0.68;

    // Compile all report data
    const reportData = {
      salesByProduct: salesByProductData,
      salesByDate,
      rebatesByLevel: rebatesByLevelData,
      usersByRank: usersByRankData,
      topEarners: topEarnersData,
      topRecruiters: topRecruitersData,
      summary: {
        totalUsers,
        totalProducts,
        totalSales,
        totalRebates,
        averageOrderValue,
        conversionRate,
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}

// Helper function to get sales by date
async function getSalesByDate(startDate: Date, endDate: Date) {
  // Calculate the number of months between start and end dates
  const months = [];
  const labels = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    months.push({ year, month });
    labels.push(new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Get sales data for each month
  const salesData = [];
  
  for (const { year, month } of months) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    const result = await prisma.purchase.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });
    
    salesData.push(result._sum.totalAmount || 0);
  }
  
  return {
    labels,
    data: salesData,
  };
}
