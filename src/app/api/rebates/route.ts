import { prisma } from "@/lib/prisma";
import { processRebates } from "@/lib/rebateCalculator";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view rebates" },
        { status: 401 }
      );
    }

    // Get the authenticated user
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

    const userId = user.id;
    const isAdmin = user.rankId === 6; // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const userIdParam = searchParams.get("userId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    let whereClause: any = {};

    if (isAdmin && userIdParam) {
      whereClause.receiverId = parseInt(userIdParam);
    } else {
      whereClause.receiverId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate) {
      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // Set to end of day

      whereClause.createdAt = {
        ...(whereClause.createdAt || {}),
        lte: endDateTime,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Get rebates with pagination
    const rebates = await prisma.rebate.findMany({
      where: whereClause,
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
      skip,
      take: pageSize,
    });

    // Get total count for pagination
    const totalRebates = await prisma.rebate.count({ where: whereClause });

    // Calculate total pages
    const totalPages = Math.ceil(totalRebates / pageSize);

    return NextResponse.json({
      rebates,
      pagination: {
        page,
        pageSize,
        totalItems: totalRebates,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching rebates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rebates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to process rebates" },
        { status: 401 }
      );
    }

    // TODO: Add admin check
    const isAdmin = false;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only administrators can process rebates" },
        { status: 403 }
      );
    }

    // Process pending rebates
    await processRebates();

    return NextResponse.json({ message: "Rebates processed successfully" });
  } catch (error) {
    console.error("Error processing rebates:", error);
    return NextResponse.json(
      { error: "Failed to process rebates" },
      { status: 500 }
    );
  }
}
