import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAdditionalLevels } from "@/lib/genealogyService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy" },
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
    const currentLevelParam = url.searchParams.get("currentLevel");
    const maxLevelParam = url.searchParams.get("maxLevel");
    
    if (!targetUserIdParam || !currentLevelParam) {
      return NextResponse.json(
        { error: "Missing required parameters: userId and currentLevel" },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(targetUserIdParam);
    const currentLevel = parseInt(currentLevelParam);
    const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : 10;

    // Load additional levels
    const additionalLevelsData = await loadAdditionalLevels(
      targetUserId,
      currentLevel,
      maxLevel
    );

    return NextResponse.json(additionalLevelsData);
  } catch (error) {
    console.error("Error loading additional levels:", error);
    return NextResponse.json(
      { error: "Failed to load additional levels" },
      { status: 500 }
    );
  }
}
