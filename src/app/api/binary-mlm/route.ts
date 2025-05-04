import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  buildBinaryTree, 
  getDownlineByLevel, 
  calculateDownlinePV,
  calculateCommissions,
  getMonthlyPerformance,
  simulateEarnings
} from "@/lib/binaryMlmService";
import { z } from "zod";

// Schema for date range validation
const dateRangeSchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid end date format",
  }),
});

// Schema for monthly period validation
const monthlyPeriodSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view binary MLM data" },
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
    const action = url.searchParams.get("action");
    const maxDepthParam = url.searchParams.get("maxDepth");
    const maxDepth = maxDepthParam ? parseInt(maxDepthParam) : 6;
    const targetUserIdParam = url.searchParams.get("userId");
    const targetUserId = targetUserIdParam ? parseInt(targetUserIdParam) : user.id;

    // Check if the user has permission to view the target user's data
    // For simplicity, we'll allow any authenticated user to view any data
    // In a real application, you might want to add more permission checks

    // Handle different actions
    switch (action) {
      case "tree":
        // Get binary tree structure
        const tree = await buildBinaryTree(targetUserId, maxDepth);
        return NextResponse.json({ tree });

      case "downline":
        // Get downline by level
        const downline = await getDownlineByLevel(targetUserId, maxDepth);
        return NextResponse.json({ downline });

      case "pv":
        // Get PV calculations
        // Parse date range parameters
        const startDateParam = url.searchParams.get("startDate");
        const endDateParam = url.searchParams.get("endDate");
        
        if (!startDateParam || !endDateParam) {
          return NextResponse.json(
            { error: "startDate and endDate parameters are required for PV calculation" },
            { status: 400 }
          );
        }
        
        const dateRangeResult = dateRangeSchema.safeParse({
          startDate: startDateParam,
          endDate: endDateParam,
        });
        
        if (!dateRangeResult.success) {
          return NextResponse.json(
            { error: dateRangeResult.error.errors },
            { status: 400 }
          );
        }
        
        const startDate = new Date(dateRangeResult.data.startDate);
        const endDate = new Date(dateRangeResult.data.endDate);
        
        const pvData = await calculateDownlinePV(targetUserId, startDate, endDate);
        return NextResponse.json({ pv: pvData });

      case "commissions":
        // Calculate commissions
        // Parse date range parameters
        const commStartDateParam = url.searchParams.get("startDate");
        const commEndDateParam = url.searchParams.get("endDate");
        
        if (!commStartDateParam || !commEndDateParam) {
          return NextResponse.json(
            { error: "startDate and endDate parameters are required for commission calculation" },
            { status: 400 }
          );
        }
        
        const commDateRangeResult = dateRangeSchema.safeParse({
          startDate: commStartDateParam,
          endDate: commEndDateParam,
        });
        
        if (!commDateRangeResult.success) {
          return NextResponse.json(
            { error: commDateRangeResult.error.errors },
            { status: 400 }
          );
        }
        
        const commStartDate = new Date(commDateRangeResult.data.startDate);
        const commEndDate = new Date(commDateRangeResult.data.endDate);
        
        const commissions = await calculateCommissions(targetUserId, commStartDate, commEndDate);
        return NextResponse.json({ commissions });

      case "performance":
        // Get monthly performance
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
        
        const performance = await getMonthlyPerformance(targetUserId, year, month);
        return NextResponse.json({ performance });

      default:
        // Default: return basic user info with binary placement
        const userData = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            email: true,
            rankId: true,
            uplineId: true,
            leftLegId: true,
            rightLegId: true,
            placementPosition: true,
            walletBalance: true,
            rank: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
          },
        });
        
        return NextResponse.json({ user: userData });
    }
  } catch (error) {
    console.error("Error fetching binary MLM data:", error);
    return NextResponse.json(
      { error: "Failed to fetch binary MLM data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
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

    // Parse request body
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "simulate":
        // Simulate earnings for a specific month
        // Only admins can simulate for other users
        const targetUserId = body.userId || user.id;
        
        if (!isAdmin && targetUserId !== user.id) {
          return NextResponse.json(
            { error: "You do not have permission to simulate earnings for other users" },
            { status: 403 }
          );
        }
        
        const periodResult = monthlyPeriodSchema.safeParse({
          year: body.year,
          month: body.month,
        });
        
        if (!periodResult.success) {
          return NextResponse.json(
            { error: periodResult.error.errors },
            { status: 400 }
          );
        }
        
        const { year, month } = periodResult.data;
        
        const simulation = await simulateEarnings(targetUserId, year, month);
        return NextResponse.json({ simulation });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error processing binary MLM action:", error);
    return NextResponse.json(
      { error: "Failed to process binary MLM action" },
      { status: 500 }
    );
  }
}
