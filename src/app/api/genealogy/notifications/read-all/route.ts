import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the request schema
const requestSchema = z.object({
  userId: z.number(),
});

/**
 * POST /api/genealogy/notifications/read-all
 * Mark all notifications as read for a user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to mark notifications as read" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId } = validationResult.data;
    
    // Check if the user has permission to mark notifications as read
    const currentUserId = parseInt(session.user.id as string);
    
    if (userId !== currentUserId) {
      return NextResponse.json(
        { error: "You do not have permission to mark notifications as read for this user" },
        { status: 403 }
      );
    }
    
    // Get all downline members for the user
    const downlineMembers = await getDownlineMembers(userId);
    const downlineMemberIds = downlineMembers.map(member => member.id);
    
    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        OR: [
          // Notifications for the user
          { userId },
          // Notifications for downline members
          {
            userId: {
              in: downlineMemberIds,
            },
            // Only include certain types of notifications for downline members
            type: {
              in: ['new_member', 'rank_advancement', 'purchase'],
            },
          },
        ],
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}

/**
 * Get all downline members for a user
 */
async function getDownlineMembers(userId: number) {
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
  
  // Get all downline members recursively
  const downlineMembers: { id: number }[] = [];
  
  function addDownlineMembers(id: number) {
    const directDownline = downlineMap.get(id) || [];
    
    directDownline.forEach(downlineId => {
      downlineMembers.push({ id: downlineId });
      addDownlineMembers(downlineId);
    });
  }
  
  // Start with the user
  addDownlineMembers(userId);
  
  return downlineMembers;
}
