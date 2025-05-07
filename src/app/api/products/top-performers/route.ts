import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/top-performers
 * Get top performing products based on conversion rates and commissions
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "5");
    
    // Get top products by conversion rate
    const topProducts = await prisma.$transaction(async (tx) => {
      // Get all shareable links with their products
      const links = await tx.shareableLink.findMany({
        where: {
          productId: {
            not: null,
          },
          clickCount: {
            gt: 0,
          },
        },
        select: {
          productId: true,
          clickCount: true,
          conversionCount: true,
          totalRevenue: true,
          totalCommission: true,
        },
      });
      
      // Group by product and calculate metrics
      const productMetrics: Record<number, {
        productId: number;
        totalClicks: number;
        totalConversions: number;
        totalRevenue: number;
        totalCommissions: number;
        conversionRate: number;
      }> = {};
      
      links.forEach(link => {
        if (!link.productId) return;
        
        if (!productMetrics[link.productId]) {
          productMetrics[link.productId] = {
            productId: link.productId,
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0,
            totalCommissions: 0,
            conversionRate: 0,
          };
        }
        
        productMetrics[link.productId].totalClicks += link.clickCount;
        productMetrics[link.productId].totalConversions += link.conversionCount;
        productMetrics[link.productId].totalRevenue += link.totalRevenue;
        productMetrics[link.productId].totalCommissions += link.totalCommission;
      });
      
      // Calculate conversion rates
      Object.values(productMetrics).forEach(metric => {
        if (metric.totalClicks > 0) {
          metric.conversionRate = (metric.totalConversions / metric.totalClicks) * 100;
        }
      });
      
      // Sort by conversion rate (descending)
      const sortedMetrics = Object.values(productMetrics)
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, limit);
      
      // Get product details
      const productIds = sortedMetrics.map(metric => metric.productId);
      
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          srp: true,
          pv: true,
          image: true,
        },
      });
      
      // Combine product details with metrics
      return products.map(product => {
        const metrics = productMetrics[product.id];
        return {
          ...product,
          conversionRate: metrics ? Math.round(metrics.conversionRate * 10) / 10 : 0,
          totalSales: metrics ? metrics.totalRevenue : 0,
          totalCommissions: metrics ? metrics.totalCommissions : 0,
        };
      }).sort((a, b) => b.conversionRate - a.conversionRate);
    });
    
    // If we don't have enough top products, fill with other active products
    let finalProducts = [...topProducts];
    
    if (finalProducts.length < limit) {
      const remainingCount = limit - finalProducts.length;
      const existingIds = finalProducts.map(p => p.id);
      
      const additionalProducts = await prisma.product.findMany({
        where: {
          id: {
            notIn: existingIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          srp: true,
          pv: true,
          image: true,
        },
        take: remainingCount,
        orderBy: {
          pv: 'desc', // Order by PV as a fallback
        },
      });
      
      finalProducts = [...finalProducts, ...additionalProducts];
    }
    
    return NextResponse.json({ products: finalProducts });
  } catch (error) {
    console.error("Error fetching top performing products:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performing products" },
      { status: 500 }
    );
  }
}
