import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getMonthlyCutoffs,
  createMonthlyCutoff,
  updateMonthlyCutoff,
  getCurrentMonthlyCutoff
} from "@/lib/mlmConfigService";
import { processMonthlyCommissions } from "@/lib/unifiedMlmService";
import { z } from "zod";

// Schema for cutoff creation
const cutoffCreateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  cutoffDay: z.number().int().min(1).max(31),
  notes: z.string().optional(),
});

// Schema for cutoff update
const cutoffUpdateSchema = z.object({
  cutoffDay: z.number().int().min(1).max(31).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view cutoff data" },
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
      select: { id: true, rankId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin (rank 6 or higher)
    const isAdmin = user.rankId >= 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view cutoff data" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "list";
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    
    let year: number | undefined;
    let month: number | undefined;
    
    if (yearParam) {
      year = parseInt(yearParam);
    }
    
    if (monthParam) {
      month = parseInt(monthParam);
    }
    
    switch (action) {
      case "list":
        // Get cutoffs with optional year/month filter
        const cutoffs = await getMonthlyCutoffs(year, month);
        return NextResponse.json({ cutoffs });
      
      case "current":
        // Get current or upcoming cutoff
        const currentCutoff = await getCurrentMonthlyCutoff();
        return NextResponse.json({ cutoff: currentCutoff });
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching cutoff data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cutoff data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to manage cutoffs" },
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
      select: { id: true, rankId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin (rank 6 or higher)
    const isAdmin = user.rankId >= 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to manage cutoffs" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const action = body.action || 'create';
    
    switch (action) {
      case 'create':
        // Validate cutoff creation
        const cutoffCreateResult = cutoffCreateSchema.safeParse(body);
        
        if (!cutoffCreateResult.success) {
          return NextResponse.json(
            { error: cutoffCreateResult.error.errors },
            { status: 400 }
          );
        }
        
        const cutoffCreate = cutoffCreateResult.data;
        
        // Create the cutoff
        const createdCutoff = await createMonthlyCutoff({
          year: cutoffCreate.year,
          month: cutoffCreate.month,
          cutoffDay: cutoffCreate.cutoffDay,
          notes: cutoffCreate.notes,
        });
        
        return NextResponse.json({
          cutoff: createdCutoff,
          message: "Monthly cutoff created successfully",
        });
      
      case 'update':
        // Validate cutoff ID
        const cutoffId = body.cutoffId;
        
        if (!cutoffId || typeof cutoffId !== 'number') {
          return NextResponse.json(
            { error: "Invalid cutoff ID" },
            { status: 400 }
          );
        }
        
        // Validate cutoff update
        const cutoffUpdateResult = cutoffUpdateSchema.safeParse(body);
        
        if (!cutoffUpdateResult.success) {
          return NextResponse.json(
            { error: cutoffUpdateResult.error.errors },
            { status: 400 }
          );
        }
        
        const cutoffUpdate = cutoffUpdateResult.data;
        
        // Update the cutoff
        const updatedCutoff = await updateMonthlyCutoff(cutoffId, cutoffUpdate);
        
        return NextResponse.json({
          cutoff: updatedCutoff,
          message: "Monthly cutoff updated successfully",
        });
      
      case 'process':
        // Validate year and month
        if (!body.year || !body.month) {
          return NextResponse.json(
            { error: "Year and month are required" },
            { status: 400 }
          );
        }
        
        const year = parseInt(body.year);
        const month = parseInt(body.month);
        
        // Process the monthly commissions
        const result = await processMonthlyCommissions(year, month);
        
        return NextResponse.json({
          result,
          message: "Monthly commissions processed successfully",
        });
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error managing cutoffs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage cutoffs" },
      { status: 500 }
    );
  }
}
