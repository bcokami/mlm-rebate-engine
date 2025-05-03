import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if the authenticated user is an admin
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }
    
    const authenticatedUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, rankId: true },
    });
    
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 }
      );
    }
    
    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    if (authenticatedUser.rankId !== 6) {
      return NextResponse.json(
        { error: "You do not have permission to access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          generator: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          receiver: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (startDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // Set to end of day
      
      where.createdAt = {
        ...(where.createdAt || {}),
        lte: endDateTime,
      };
    }

    // Get all rebates matching the criteria
    const rebates = await prisma.rebate.findMany({
      where,
      include: {
        purchase: {
          include: {
            product: true,
          },
        },
        generator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV content
    const headers = [
      "ID",
      "Date",
      "Generator Name",
      "Generator Email",
      "Receiver Name",
      "Receiver Email",
      "Product",
      "Purchase Amount",
      "Level",
      "Percentage",
      "Rebate Amount",
      "Status",
      "Processed At"
    ];

    const rows = rebates.map(rebate => [
      rebate.id,
      new Date(rebate.createdAt).toISOString().split('T')[0],
      rebate.generator.name,
      rebate.generator.email,
      rebate.receiver.name,
      rebate.receiver.email,
      rebate.purchase.product.name,
      rebate.purchase.totalAmount.toFixed(2),
      rebate.level,
      rebate.percentage.toFixed(2) + "%",
      rebate.amount.toFixed(2),
      rebate.status,
      rebate.processedAt ? new Date(rebate.processedAt).toISOString().split('T')[0] : ""
    ]);

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rebates-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error("Error exporting rebates:", error);
    return NextResponse.json(
      { error: "Failed to export rebates" },
      { status: 500 }
    );
  }
}
