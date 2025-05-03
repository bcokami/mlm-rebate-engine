import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view rebate statistics" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get total rebates count
    const totalRebates = await prisma.rebate.count({
      where: { receiverId: user.id },
    });

    // Get total rebate amount
    const totalAmountResult = await prisma.rebate.aggregate({
      where: { receiverId: user.id },
      _sum: {
        amount: true,
      },
    });
    const totalAmount = totalAmountResult._sum.amount || 0;

    // Get pending rebates stats
    const pendingRebates = await prisma.rebate.findMany({
      where: { 
        receiverId: user.id,
        status: "pending" 
      },
    });
    const pendingCount = pendingRebates.length;
    const pendingAmount = pendingRebates.reduce(
      (sum, rebate) => sum + rebate.amount,
      0
    );

    // Get processed rebates stats
    const processedRebates = await prisma.rebate.findMany({
      where: { 
        receiverId: user.id,
        status: "processed" 
      },
    });
    const processedCount = processedRebates.length;
    const processedAmount = processedRebates.reduce(
      (sum, rebate) => sum + rebate.amount,
      0
    );

    // Get failed rebates stats
    const failedRebates = await prisma.rebate.findMany({
      where: { 
        receiverId: user.id,
        status: "failed" 
      },
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
