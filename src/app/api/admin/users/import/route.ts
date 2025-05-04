import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseUserExcel, importUsers, generateUserImportTemplate } from "@/lib/userExcelService";
import { z } from "zod";

// Schema for import options
const importOptionsSchema = z.object({
  defaultPassword: z.string().min(8).default("Password123!"),
  skipDuplicates: z.boolean().default(true),
});

/**
 * POST /api/admin/users/import
 * Import users from Excel file
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
    // In a real app, you'd check for specific roles
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Get content type
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const optionsJson = formData.get("options") as string;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }
      
      // Parse options
      let options = { defaultPassword: "Password123!", skipDuplicates: true };
      if (optionsJson) {
        try {
          const parsedOptions = JSON.parse(optionsJson);
          const validationResult = importOptionsSchema.safeParse(parsedOptions);
          if (validationResult.success) {
            options = validationResult.data;
          }
        } catch (error) {
          console.error("Error parsing import options:", error);
        }
      }
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Parse Excel file
      const validationResults = await parseUserExcel(buffer);
      
      // Return validation results for preview
      return NextResponse.json({
        validationResults,
        totalRows: validationResults.length,
        validRows: validationResults.filter(r => r.isValid).length,
        invalidRows: validationResults.filter(r => !r.isValid).length,
      });
    } else {
      // Handle JSON request for confirming import
      const body = await request.json();
      const { validatedData, options = { defaultPassword: "Password123!" } } = body;
      
      if (!validatedData || !Array.isArray(validatedData)) {
        return NextResponse.json(
          { error: "Invalid validated data" },
          { status: 400 }
        );
      }
      
      // Import users
      const result = await importUsers(
        validatedData,
        options.defaultPassword,
        user!.id,
        user!.name
      );
      
      // Log the import action
      await prisma.userAudit.create({
        data: {
          userId: user!.id,
          action: "bulk_import",
          details: JSON.stringify({
            totalProcessed: result.totalProcessed,
            successful: result.successful,
            failed: result.failed,
            duplicates: result.duplicates,
            timestamp: new Date().toISOString(),
          }),
        },
      });
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error importing users:", error);
    return NextResponse.json(
      { error: "Failed to import users" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/import
 * Get import template
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

    // Generate template
    const templateBuffer = generateUserImportTemplate();
    
    // Return template
    return new NextResponse(templateBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=user_import_template.xlsx",
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
