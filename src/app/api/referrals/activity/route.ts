import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/referrals/activity
 * Get recent referral activity for the current user
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
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    // Get user's shareable links
    const userLinks = await prisma.shareableLink.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        code: true,
        productId: true,
      },
    });
    
    const linkIds = userLinks.map(link => link.id);
    
    // Get recent clicks
    const recentClicks = await prisma.linkClick.findMany({
      where: {
        linkId: {
          in: linkIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        linkId: true,
        createdAt: true,
      },
    });
    
    // Get recent commissions
    const recentCommissions = await prisma.referralCommission.findMany({
      where: {
        linkId: {
          in: linkIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        linkId: true,
        productId: true,
        amount: true,
        createdAt: true,
      },
    });
    
    // Combine and format activities
    const activities = [
      ...recentClicks.map(click => {
        const link = userLinks.find(l => l.id === click.linkId);
        return {
          id: `click_${click.id}`,
          type: "click",
          linkId: click.linkId,
          linkCode: link?.code || "",
          productId: link?.productId || null,
          createdAt: click.createdAt,
        };
      }),
      ...recentCommissions.map(commission => {
        const link = userLinks.find(l => l.id === commission.linkId);
        return {
          id: `commission_${commission.id}`,
          type: "commission",
          linkId: commission.linkId,
          linkCode: link?.code || "",
          productId: commission.productId,
          amount: commission.amount,
          createdAt: commission.createdAt,
        };
      }),
    ]
    // Sort by date (newest first)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    // Limit to requested number
    .slice(0, limit);
    
    // Get product details for activities with productId
    const productIds = activities
      .filter(activity => activity.productId)
      .map(activity => activity.productId as number);
    
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });
    
    // Add product details to activities
    const activitiesWithProductDetails = activities.map(activity => {
      if (!activity.productId) return activity;
      
      const product = products.find(p => p.id === activity.productId);
      if (!product) return activity;
      
      return {
        ...activity,
        productName: product.name,
        productImage: product.image,
      };
    });
    
    return NextResponse.json({ activities: activitiesWithProductDetails });
  } catch (error) {
    console.error("Error fetching referral activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral activity" },
      { status: 500 }
    );
  }
}
