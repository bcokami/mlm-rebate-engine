import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processAllRankAdvancements } from "@/lib/rankAdvancementService";

// POST: Process all rank advancements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to process rank advancements" },
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

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to process rank advancements" },
        { status: 403 }
      );
    }

    // Process all rank advancements
    const results = await processAllRankAdvancements();

    return NextResponse.json({
      success: true,
      ...results,
      message: `Processed ${results.processed} users, advanced ${results.advanced} users, failed ${results.failed} users`,
    });
  } catch (error) {
    console.error("Error processing all rank advancements:", error);
    return NextResponse.json(
      { error: "Failed to process all rank advancements" },
      { status: 500 }
    );
  }
}

// GET: Get rank advancement history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view rank advancement history" },
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

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view rank advancement history" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;
    const userIdParam = url.searchParams.get("userId");
    const userId = userIdParam ? parseInt(userIdParam) : undefined;

    // Build where clause
    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get rank advancements with pagination
    const rankAdvancements = await prisma.rankAdvancement.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        previousRank: true,
        newRank: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Get total count for pagination
    const totalRankAdvancements = await prisma.rankAdvancement.count({
      where: whereClause,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalRankAdvancements / pageSize);

    return NextResponse.json({
      rankAdvancements,
      pagination: {
        page,
        pageSize,
        totalItems: totalRankAdvancements,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching rank advancement history:", error);
    return NextResponse.json(
      { error: "Failed to fetch rank advancement history" },
      { status: 500 }
    );
  }
}
