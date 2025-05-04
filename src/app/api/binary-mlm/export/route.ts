import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMonthlyPerformance, getTopEarners } from "@/lib/binaryMlmService";
import { z } from "zod";

// Schema for export parameters
const exportParamsSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  format: z.enum(["csv", "json"]),
  type: z.enum(["personal", "team", "top"]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to export reports" },
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

    // Get query parameters
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");
    const formatParam = url.searchParams.get("format") || "csv";
    const typeParam = url.searchParams.get("type") || "personal";
    const targetUserIdParam = url.searchParams.get("userId");
    const limitParam = url.searchParams.get("limit");
    
    // Validate parameters
    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: "Year and month parameters are required" },
        { status: 400 }
      );
    }
    
    const year = parseInt(yearParam);
    const month = parseInt(monthParam);
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    // Validate parameters using zod
    const paramsResult = exportParamsSchema.safeParse({
      year,
      month,
      format: formatParam,
      type: typeParam,
    });
    
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: paramsResult.error.errors },
        { status: 400 }
      );
    }
    
    const { format, type } = paramsResult.data;
    
    // Determine target user ID
    let targetUserId = user.id;
    
    if (targetUserIdParam) {
      // Check if user has permission to view other user's data
      const isAdmin = user.rankId >= 6;
      
      if (!isAdmin && parseInt(targetUserIdParam) !== user.id) {
        return NextResponse.json(
          { error: "You do not have permission to export reports for other users" },
          { status: 403 }
        );
      }
      
      targetUserId = parseInt(targetUserIdParam);
    }
    
    // Generate report based on type
    switch (type) {
      case "personal":
        // Personal performance report
        const performance = await getMonthlyPerformance(targetUserId, year, month);
        
        if (performance.length === 0) {
          return NextResponse.json(
            { error: "No performance data found for the specified period" },
            { status: 404 }
          );
        }
        
        // Get user details
        const userData = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            email: true,
            rank: {
              select: {
                name: true,
              },
            },
          },
        });
        
        if (format === "csv") {
          // Generate CSV
          const csvRows = [];
          
          // Add header row
          csvRows.push([
            "User ID",
            "Name",
            "Email",
            "Rank",
            "Year",
            "Month",
            "Personal PV",
            "Left Leg PV",
            "Right Leg PV",
            "Total Group PV",
            "Direct Referral Bonus",
            "Level Commissions",
            "Group Volume Bonus",
            "Total Earnings",
          ].join(","));
          
          // Add data rows
          performance.forEach(p => {
            csvRows.push([
              userData?.id || "",
              `"${userData?.name || ""}"`,
              `"${userData?.email || ""}"`,
              `"${userData?.rank?.name || ""}"`,
              p.year,
              p.month,
              p.personalPV,
              p.leftLegPV,
              p.rightLegPV,
              p.totalGroupPV,
              p.directReferralBonus,
              p.levelCommissions,
              p.groupVolumeBonus,
              p.totalEarnings,
            ].join(","));
          });
          
          const csvContent = csvRows.join("\n");
          
          // Return CSV data with appropriate headers
          return new NextResponse(csvContent, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="personal_performance_${year}_${month}.csv"`,
            },
          });
        } else {
          // Return JSON data
          return NextResponse.json({
            user: userData,
            performance,
          });
        }
      
      case "team":
        // Team performance report
        // Get all downline users
        const downlineUsers = await prisma.user.findMany({
          where: {
            uplineId: targetUserId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            rankId: true,
            rank: {
              select: {
                name: true,
              },
            },
          },
        });
        
        // Get performance data for each downline user
        const teamPerformance = [];
        
        for (const downlineUser of downlineUsers) {
          const userPerformance = await getMonthlyPerformance(downlineUser.id, year, month);
          
          if (userPerformance.length > 0) {
            teamPerformance.push({
              user: downlineUser,
              performance: userPerformance[0],
            });
          }
        }
        
        if (teamPerformance.length === 0) {
          return NextResponse.json(
            { error: "No team performance data found for the specified period" },
            { status: 404 }
          );
        }
        
        if (format === "csv") {
          // Generate CSV
          const csvRows = [];
          
          // Add header row
          csvRows.push([
            "User ID",
            "Name",
            "Email",
            "Rank",
            "Year",
            "Month",
            "Personal PV",
            "Left Leg PV",
            "Right Leg PV",
            "Total Group PV",
            "Direct Referral Bonus",
            "Level Commissions",
            "Group Volume Bonus",
            "Total Earnings",
          ].join(","));
          
          // Add data rows
          teamPerformance.forEach(item => {
            csvRows.push([
              item.user.id,
              `"${item.user.name}"`,
              `"${item.user.email}"`,
              `"${item.user.rank.name}"`,
              item.performance.year,
              item.performance.month,
              item.performance.personalPV,
              item.performance.leftLegPV,
              item.performance.rightLegPV,
              item.performance.totalGroupPV,
              item.performance.directReferralBonus,
              item.performance.levelCommissions,
              item.performance.groupVolumeBonus,
              item.performance.totalEarnings,
            ].join(","));
          });
          
          const csvContent = csvRows.join("\n");
          
          // Return CSV data with appropriate headers
          return new NextResponse(csvContent, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="team_performance_${year}_${month}.csv"`,
            },
          });
        } else {
          // Return JSON data
          return NextResponse.json({
            teamPerformance,
          });
        }
      
      case "top":
        // Top earners report
        // Check if user has permission to view top earners
        const isAdmin = user.rankId >= 6;
        
        if (!isAdmin) {
          return NextResponse.json(
            { error: "You do not have permission to view top earners report" },
            { status: 403 }
          );
        }
        
        const topEarners = await getTopEarners(year, month, limit);
        
        if (topEarners.length === 0) {
          return NextResponse.json(
            { error: "No top earners data found for the specified period" },
            { status: 404 }
          );
        }
        
        if (format === "csv") {
          // Generate CSV
          const csvRows = [];
          
          // Add header row
          csvRows.push([
            "Rank",
            "User ID",
            "Name",
            "Email",
            "User Rank",
            "Year",
            "Month",
            "Personal PV",
            "Total Group PV",
            "Direct Referral Bonus",
            "Level Commissions",
            "Group Volume Bonus",
            "Total Earnings",
          ].join(","));
          
          // Add data rows
          topEarners.forEach((item, index) => {
            csvRows.push([
              index + 1,
              item.user.id,
              `"${item.user.name}"`,
              `"${item.user.email}"`,
              `"${item.user.rank.name}"`,
              item.year,
              item.month,
              item.personalPV,
              item.totalGroupPV,
              item.directReferralBonus,
              item.levelCommissions,
              item.groupVolumeBonus,
              item.totalEarnings,
            ].join(","));
          });
          
          const csvContent = csvRows.join("\n");
          
          // Return CSV data with appropriate headers
          return new NextResponse(csvContent, {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": `attachment; filename="top_earners_${year}_${month}.csv"`,
            },
          });
        } else {
          // Return JSON data
          return NextResponse.json({
            topEarners,
          });
        }
      
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
