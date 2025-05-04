import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this resource" },
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

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { rank: true },
    });

    if (!user || user.rank.level < 6) { // Diamond rank (level 6) required for admin access
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    // Get counts for dashboard stats
    const [
      totalUsers,
      totalProducts,
      totalPurchases,
      totalRebates,
      pendingRebates,
      processedRebates,
      totalRebateAmount,
      recentUsers,
      recentPurchases,
      topProducts,
      topDistributors
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total products
      prisma.product.count(),
      
      // Total purchases
      prisma.purchase.count(),
      
      // Total rebates
      prisma.rebate.count(),
      
      // Pending rebates
      prisma.rebate.count({
        where: { status: "pending" }
      }),
      
      // Processed rebates
      prisma.rebate.count({
        where: { status: "processed" }
      }),
      
      // Total rebate amount
      prisma.rebate.aggregate({
        _sum: { amount: true }
      }),
      
      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { rank: true }
      }),
      
      // Recent purchases (last 5)
      prisma.purchase.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          product: true
        }
      }),
      
      // Top products by purchase count
      prisma.product.findMany({
        take: 5,
        include: {
          _count: {
            select: { purchases: true }
          }
        },
        orderBy: {
          purchases: {
            _count: "desc"
          }
        }
      }),
      
      // Top distributors by downline count
      prisma.user.findMany({
        take: 5,
        include: {
          rank: true,
          _count: {
            select: { downline: true }
          }
        },
        orderBy: {
          downline: {
            _count: "desc"
          }
        }
      })
    ]);

    // Format the data for the frontend
    const formattedRecentUsers = recentUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      rank: user.rank.name,
      createdAt: user.createdAt
    }));

    const formattedRecentPurchases = recentPurchases.map(purchase => ({
      id: purchase.id,
      productName: purchase.product.name,
      userName: purchase.user.name,
      amount: purchase.totalAmount,
      date: purchase.createdAt
    }));

    const formattedTopProducts = topProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      purchaseCount: product._count.purchases
    }));

    const formattedTopDistributors = topDistributors.map(user => ({
      id: user.id,
      name: user.name,
      rank: user.rank.name,
      downlineCount: user._count.downline
    }));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProducts,
        totalPurchases,
        totalRebates,
        pendingRebates,
        processedRebates,
        totalRebateAmount: totalRebateAmount._sum.amount || 0
      },
      recentActivity: {
        users: formattedRecentUsers,
        purchases: formattedRecentPurchases
      },
      topPerformers: {
        products: formattedTopProducts,
        distributors: formattedTopDistributors
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}
