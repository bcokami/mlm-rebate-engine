import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userCache } from "@/lib/cache";
import bcrypt from "bcryptjs";
import { updateUserSchema, validate } from "@/lib/validation";

// GET a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `user:${userId}`;

    // Try to get from cache first
    const user = await userCache.getOrSet(cacheKey, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
          rankId: true,
          uplineId: true,
          walletBalance: true,
          createdAt: true,
          rank: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          upline: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              downline: true,
              purchases: true,
              rebatesReceived: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      // Get additional statistics
      const stats = await prisma.$transaction([
        // Total purchases amount
        prisma.purchase.aggregate({
          where: { userId },
          _sum: { totalAmount: true },
        }),
        // Total rebates received
        prisma.rebate.aggregate({
          where: { receiverId: userId },
          _sum: { amount: true },
        }),
        // Total rebates generated
        prisma.rebate.aggregate({
          where: { generatorId: userId },
          _sum: { amount: true },
        }),
        // Direct downline count
        prisma.user.count({
          where: { uplineId: userId },
        }),
      ]);

      return {
        ...user,
        stats: {
          totalPurchases: stats[0]._sum.totalAmount || 0,
          totalRebatesReceived: stats[1]._sum.amount || 0,
          totalRebatesGenerated: stats[2]._sum.amount || 0,
          directDownlineCount: stats[3],
        },
      };
    }, 5 * 60 * 1000); // Cache for 5 minutes

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH to update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if the authenticated user is the same as the user being updated
    // or if the authenticated user is an admin (you would need to add admin role check)
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }
    
    // Only allow users to update their own profile (unless they're an admin)
    if (authenticatedUser.id !== userId) {
      // TODO: Add admin role check here
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input data
    const validation = validate(updateUserSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      );
    }

    const { name, phone, currentPassword, newPassword, profileImage } = validation.data!;

    // Prepare update data
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }

      // Get the user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash the new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        rankId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear user cache
    userCache.delete(`user:${userId}`);
    userCache.clearNamespace();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check here
    // For now, we'll just return a not implemented response
    return NextResponse.json(
      { error: "This feature is not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
