import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processBonusReward } from "@/lib/referralService";

// POST: Process a bonus reward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to process bonus rewards" },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, rankId: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is an admin (for simplicity, we'll consider any user with rankId 6 as admin)
    const isAdmin = user.rankId === 6;

    // Only admins can process bonus rewards
    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to process bonus rewards" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userId, triggerType, triggerData } = body;

    if (!userId || !triggerType) {
      return NextResponse.json(
        { error: "Missing required fields: userId and triggerType" },
        { status: 400 }
      );
    }

    // Process the bonus reward
    const result = await processBonusReward(userId, triggerType, triggerData || {});

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing bonus reward:", error);
    return NextResponse.json(
      { error: "Failed to process bonus reward" },
      { status: 500 }
    );
  }
}

// GET: Get all bonus rewards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view bonus rewards" },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, rankId: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is an admin (for simplicity, we'll consider any user with rankId 6 as admin)
    const isAdmin = user.rankId === 6;

    // Only admins can view all bonus rewards
    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view bonus rewards" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const triggerType = url.searchParams.get("triggerType");

    // Build where clause
    const whereClause: any = {};
    if (triggerType) {
      whereClause.triggerType = triggerType;
    }

    // Get all bonus rewards
    const bonusRewards = await prisma.bonusReward.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ bonusRewards });
  } catch (error) {
    console.error("Error fetching bonus rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch bonus rewards" },
      { status: 500 }
    );
  }
}
