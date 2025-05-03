import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      select: { id: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get rank advancements for the user with pagination
    const rankAdvancements = await prisma.rankAdvancement.findMany({
      where: {
        userId: user.id,
      },
      include: {
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
      where: {
        userId: user.id,
      },
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
