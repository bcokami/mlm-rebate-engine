import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the request schema
const requestSchema = z.object({
  userId: z.string().transform(val => parseInt(val)),
  limit: z.string().transform(val => parseInt(val)).default('5'),
  type: z.enum(['new_member', 'purchase', 'rank_advancement', 'rebate', 'system']).optional(),
});

/**
 * GET /api/genealogy/notifications
 * Get notifications for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access notifications" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = url.searchParams.get('limit') || '5';
    const type = url.searchParams.get('type') || undefined;
    
    // Validate parameters
    const validationResult = requestSchema.safeParse({
      userId,
      limit,
      type,
    });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId: validUserId, limit: validLimit, type: validType } = validationResult.data;
    
    // Get all downline members for the user
    const downlineMembers = await getDownlineMembers(validUserId);
    const downlineMemberIds = downlineMembers.map(member => member.id);
    
    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          // Notifications for the user
          { userId: validUserId },
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
        // Filter by type if specified
        ...(validType ? { type: validType } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: validLimit,
    });
    
    // Return notifications
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
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
