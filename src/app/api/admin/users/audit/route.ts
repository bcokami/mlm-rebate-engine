import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/users/audit
 * Get user audit logs
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin rights
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is admin or HR
    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rankId: true },
    });

    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const actionParam = url.searchParams.get("action");
    
    // Parse parameters
    const limit = limitParam ? parseInt(limitParam) : 10;
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    
    // Build where clause
    const whereClause: any = {};
    
    if (actionParam) {
      whereClause.action = actionParam;
    } else {
      // Only get import/export actions by default
      whereClause.action = {
        in: ["import", "bulk_import", "export"],
      };
    }
    
    // Get audit logs
    const auditLogs = await prisma.userAudit.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });
    
    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
