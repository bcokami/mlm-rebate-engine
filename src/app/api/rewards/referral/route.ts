import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processReferralReward } from "@/lib/referralService";

// POST: Process a referral reward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to process referral rewards" },
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

    // Get request body
    const body = await request.json();
    const { referrerId, newUserId } = body;

    if (!referrerId || !newUserId) {
      return NextResponse.json(
        { error: "Missing required fields: referrerId and newUserId" },
        { status: 400 }
      );
    }

    // Only admins can process referral rewards
    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to process referral rewards" },
        { status: 403 }
      );
    }

    // Process the referral reward
    const result = await processReferralReward(referrerId, newUserId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing referral reward:", error);
    return NextResponse.json(
      { error: "Failed to process referral reward" },
      { status: 500 }
    );
  }
}

// GET: Get all referral rewards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view referral rewards" },
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

    // Only admins can view all referral rewards
    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view referral rewards" },
        { status: 403 }
      );
    }

    // Get all referral rewards
    const referralRewards = await prisma.referralReward.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ referralRewards });
  } catch (error) {
    console.error("Error fetching referral rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral rewards" },
      { status: 500 }
    );
  }
}
