import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPaginatedDownline } from "@/lib/genealogyService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get query parameters
    const url = new URL(request.url);
    const maxLevelParam = url.searchParams.get("maxLevel");
    const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : 10;
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSizeParam = url.searchParams.get("pageSize");
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;

    // Get paginated downline
    const genealogyData = await getPaginatedDownline(userId, maxLevel, page, pageSize);

    // Format the response
    const genealogyTree = {
      ...genealogyData.user,
      children: genealogyData.downline,
      pagination: genealogyData.pagination,
    };

    return NextResponse.json(genealogyTree);
  } catch (error) {
    console.error("Error fetching genealogy:", error);
    return NextResponse.json(
      { error: "Failed to fetch genealogy" },
      { status: 500 }
    );
  }
}
