import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRankAdvancementEligibility, processRankAdvancement } from "@/lib/rankAdvancementService";

// GET: Check rank advancement eligibility
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to check rank advancement eligibility" },
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
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check rank advancement eligibility
    const eligibility = await checkRankAdvancementEligibility(user.id);

    return NextResponse.json(eligibility);
  } catch (error) {
    console.error("Error checking rank advancement eligibility:", error);
    return NextResponse.json(
      { error: "Failed to check rank advancement eligibility" },
      { status: 500 }
    );
  }
}

// POST: Process rank advancement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to process rank advancement" },
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

    // Get the target user ID from the request body
    const body = await request.json();
    const targetUserId = body.userId || user.id;

    // Only admins can process rank advancements for other users
    if (targetUserId !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to process rank advancement for other users" },
        { status: 403 }
      );
    }

    // Process rank advancement
    const result = await processRankAdvancement(targetUserId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing rank advancement:", error);
    return NextResponse.json(
      { error: "Failed to process rank advancement" },
      { status: 500 }
    );
  }
}
