import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
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
        { error: "You do not have permission to perform this action" },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create a wallet transaction for the reset
    await prisma.walletTransaction.create({
      data: {
        userId,
        amount: user.walletBalance,
        type: "admin_reset",
        status: "completed",
        description: "Admin reset wallet balance to 0",
      },
    });

    // Reset the wallet balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: 0,
      },
    });

    return NextResponse.json({
      message: "Wallet balance reset successfully",
      previousBalance: user.walletBalance,
      currentBalance: updatedUser.walletBalance,
    });
  } catch (error) {
    console.error("Error resetting wallet balance:", error);
    return NextResponse.json(
      { error: "Failed to reset wallet balance" },
      { status: 500 }
    );
  }
}
