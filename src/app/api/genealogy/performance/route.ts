import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPerformanceMetrics } from "@/lib/genealogyService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view performance metrics" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
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
    const targetUserIdParam = url.searchParams.get("userId");
    
    // Determine which user's metrics to fetch
    let targetUserId = user.id;

    if (targetUserIdParam) {
      // If userId is provided, check if the authenticated user has permission to view it
      // For simplicity, we'll allow any authenticated user to view any user's metrics
      // In a real application, you might want to add more permission checks
      targetUserId = parseInt(targetUserIdParam);
    }

    // Get performance metrics
    const performanceMetrics = await getUserPerformanceMetrics(targetUserId);

    return NextResponse.json(performanceMetrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}
