import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define the request schema
const requestSchema = z.object({
  userId: z.number(),
  settings: z.object({
    newMembers: z.boolean(),
    purchases: z.boolean(),
    rankAdvancements: z.boolean(),
    rebates: z.boolean(),
    system: z.boolean(),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
  }),
});

/**
 * GET /api/genealogy/notifications/settings
 * Get notification settings for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access notification settings" },
        { status: 401 }
      );
    }
    
    // Get user ID from query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const userIdNum = parseInt(userId);
    
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Check if the user has permission to access notification settings
    const currentUserId = parseInt(session.user.id as string);
    
    if (userIdNum !== currentUserId) {
      return NextResponse.json(
        { error: "You do not have permission to access notification settings for this user" },
        { status: 403 }
      );
    }
    
    // Get notification settings
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: {
        userId: userIdNum,
      },
    });
    
    // If no settings found, return default settings
    if (!notificationSettings) {
      return NextResponse.json({
        newMembers: true,
        purchases: true,
        rankAdvancements: true,
        rebates: true,
        system: true,
        emailNotifications: false,
        pushNotifications: false,
      });
    }
    
    // Return notification settings
    return NextResponse.json({
      newMembers: notificationSettings.newMembers,
      purchases: notificationSettings.purchases,
      rankAdvancements: notificationSettings.rankAdvancements,
      rebates: notificationSettings.rebates,
      system: notificationSettings.system,
      emailNotifications: notificationSettings.emailNotifications,
      pushNotifications: notificationSettings.pushNotifications,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/genealogy/notifications/settings
 * Update notification settings for a user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update notification settings" },
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
    
    const { userId, settings } = validationResult.data;
    
    // Check if the user has permission to update notification settings
    const currentUserId = parseInt(session.user.id as string);
    
    if (userId !== currentUserId) {
      return NextResponse.json(
        { error: "You do not have permission to update notification settings for this user" },
        { status: 403 }
      );
    }
    
    // Update notification settings
    await prisma.notificationSettings.upsert({
      where: {
        userId,
      },
      update: {
        newMembers: settings.newMembers,
        purchases: settings.purchases,
        rankAdvancements: settings.rankAdvancements,
        rebates: settings.rebates,
        system: settings.system,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
      },
      create: {
        userId,
        newMembers: settings.newMembers,
        purchases: settings.purchases,
        rankAdvancements: settings.rankAdvancements,
        rebates: settings.rebates,
        system: settings.system,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
      },
    });
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
