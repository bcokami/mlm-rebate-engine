import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/genealogy/notifications/:id/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to mark notifications as read" },
        { status: 401 }
      );
    }
    
    // Get notification ID from params
    const notificationId = parseInt(params.id);
    
    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 }
      );
    }
    
    // Get the notification
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Check if the user has permission to mark this notification as read
    const currentUserId = parseInt(session.user.id as string);
    
    if (notification.userId !== currentUserId) {
      // Check if the notification is for a downline member
      const isDownlineMember = await isUserInDownline(notification.userId, currentUserId);
      
      if (!isDownlineMember) {
        return NextResponse.json(
          { error: "You do not have permission to mark this notification as read" },
          { status: 403 }
        );
      }
    }
    
    // Mark the notification as read
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

/**
 * Check if a user is in another user's downline
 */
async function isUserInDownline(userId: number, uplineId: number): Promise<boolean> {
  // Get all users in the downline
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      uplineId: true,
    },
  });
  
  // Build a map of upline to downline
  const downlineMap = new Map<number, number[]>();
  
  allUsers.forEach(user => {
    if (user.uplineId) {
      if (!downlineMap.has(user.uplineId)) {
        downlineMap.set(user.uplineId, []);
      }
      
      downlineMap.get(user.uplineId)?.push(user.id);
    }
  });
  
  // Check if the user is in the downline
  function checkDownline(id: number): boolean {
    const directDownline = downlineMap.get(id) || [];
    
    if (directDownline.includes(userId)) {
      return true;
    }
    
    for (const downlineId of directDownline) {
      if (checkDownline(downlineId)) {
        return true;
      }
    }
    
    return false;
  }
  
  return checkDownline(uplineId);
}
