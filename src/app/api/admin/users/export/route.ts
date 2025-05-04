import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportUsersToExcel, UserExportOptions } from "@/lib/userExcelService";
import { z } from "zod";

// Schema for export options
const exportOptionsSchema = z.object({
  includeRank: z.boolean().default(true),
  includeDownlineCount: z.boolean().default(true),
  includeJoinDate: z.boolean().default(true),
  includeEarnings: z.boolean().default(false),
  rankFilter: z.number().optional(),
  dateRangeStart: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateRangeEnd: z.string().optional().transform(val => val ? new Date(val) : undefined),
  activeOnly: z.boolean().default(false),
});

/**
 * POST /api/admin/users/export
 * Export users to Excel
 */
export async function POST(request: NextRequest) {
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
      select: { id: true, name: true, rankId: true },
    });

    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate options
    const validationResult = exportOptionsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid export options", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const options: UserExportOptions = validationResult.data;
    
    // Export users
    const excelBuffer = await exportUsersToExcel(options);
    
    // Log the export action
    await prisma.userAudit.create({
      data: {
        userId: user!.id,
        action: "export",
        details: JSON.stringify({
          options,
          timestamp: new Date().toISOString(),
        }),
      },
    });
    
    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=users_export.xlsx",
      },
    });
  } catch (error) {
    console.error("Error exporting users:", error);
    return NextResponse.json(
      { error: "Failed to export users" },
      { status: 500 }
    );
  }
}
