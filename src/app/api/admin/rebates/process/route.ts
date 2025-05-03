import { prisma } from "@/lib/prisma";
import { processRebates } from "@/lib/rebateCalculator";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
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
        { error: "You do not have permission to access this endpoint" },
        { status: 403 }
      );
    }

    // Get count of pending rebates before processing
    const pendingCount = await prisma.rebate.count({
      where: { status: "pending" },
    });

    // Process pending rebates
    const result = await processRebates();

    return NextResponse.json({
      message: "Rebates processed successfully",
      processed: result.processed,
      failed: result.failed,
      totalProcessed: pendingCount,
    });
  } catch (error) {
    console.error("Error processing rebates:", error);
    return NextResponse.json(
      { error: "Failed to process rebates" },
      { status: 500 }
    );
  }
}
