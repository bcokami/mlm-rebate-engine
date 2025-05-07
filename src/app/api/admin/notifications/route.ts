import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/notifications
 * Get notifications for the current user
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
    
    // Check if user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to access this endpoint" },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const includeRead = url.searchParams.get("includeRead") === "true";
    
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
    
    // Build query
    const where: any = {
      OR: [
        { userId: user.id },
        { userId: null }, // System-wide notifications
      ],
    };
    
    // Filter by read status if needed
    if (!includeRead) {
      where.isRead = false;
    }
    
    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Get total count
    const total = await prisma.notification.count({ where });
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });
    
    // Format notifications
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      productId: notification.productId,
      productName: notification.product?.name,
      createdAt: notification.createdAt,
    }));
    
    return NextResponse.json({
      notifications: formattedNotifications,
      total,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
