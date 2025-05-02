import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRankAdvancement, checkAllUsersRankAdvancement } from "@/lib/rankService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to check rank advancement" },
        { status: 401 }
      );
    }

    // Check if this is an admin request to check all users
    const { checkAll } = await request.json();
    
    if (checkAll) {
      // TODO: Add proper admin check
      // For now, we'll just check if the user ID is 1 (admin)
      if (session.user.id !== "1") {
        return NextResponse.json(
          { error: "Only administrators can check rank advancement for all users" },
          { status: 403 }
        );
      }

      const results = await checkAllUsersRankAdvancement();
      return NextResponse.json({ results });
    } else {
      // Check rank advancement for the current user
      const userId = parseInt(session.user.id);
      const result = await checkRankAdvancement(userId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error checking rank advancement:", error);
    return NextResponse.json(
      { error: "Failed to check rank advancement" },
      { status: 500 }
    );
  }
}
