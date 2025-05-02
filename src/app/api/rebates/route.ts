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

    const userId = parseInt(session.user.id);
    const isAdmin = false; // TODO: Add admin check

    // Get query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    const status = url.searchParams.get("status");

    let whereClause: any = {};
    
    if (isAdmin && userIdParam) {
      whereClause.receiverId = parseInt(userIdParam);
    } else {
      whereClause.receiverId = userId;
    }

    if (status) {
      whereClause.status = status;
    }

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
    });

    return NextResponse.json(rebates);
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
