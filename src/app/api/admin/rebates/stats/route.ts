import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
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

    // Get total rebates count
    const totalRebates = await prisma.rebate.count();

    // Get total rebate amount
    const totalAmountResult = await prisma.rebate.aggregate({
      _sum: {
        amount: true,
      },
    });
    const totalAmount = totalAmountResult._sum.amount || 0;

    // Get pending rebates stats
    const pendingRebates = await prisma.rebate.findMany({
      where: { status: "pending" },
    });
    const pendingCount = pendingRebates.length;
    const pendingAmount = pendingRebates.reduce(
      (sum, rebate) => sum + rebate.amount,
      0
    );

    // Get processed rebates stats
    const processedRebates = await prisma.rebate.findMany({
      where: { status: "processed" },
    });
    const processedCount = processedRebates.length;
    const processedAmount = processedRebates.reduce(
      (sum, rebate) => sum + rebate.amount,
      0
    );

    // Get failed rebates stats
    const failedRebates = await prisma.rebate.findMany({
      where: { status: "failed" },
    });
    const failedCount = failedRebates.length;
    const failedAmount = failedRebates.reduce(
      (sum, rebate) => sum + rebate.amount,
      0
    );

    return NextResponse.json({
      totalRebates,
      totalAmount,
      pendingCount,
      pendingAmount,
      processedCount,
      processedAmount,
      failedCount,
      failedAmount,
    });
  } catch (error) {
    console.error("Error fetching rebate stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch rebate statistics" },
      { status: 500 }
    );
  }
}
