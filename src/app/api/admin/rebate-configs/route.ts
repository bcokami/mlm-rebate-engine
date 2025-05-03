import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Get all rebate configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view rebate configurations" },
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

    // Check if the user is an admin (for simplicity, we'll consider any user with rankId 6 as admin)
    const isAdmin = user.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view rebate configurations" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");

    // Build where clause
    const whereClause: any = {};
    if (productId) {
      whereClause.productId = parseInt(productId);
    }

    // Get all rebate configurations
    const rebateConfigs = await prisma.rebateConfig.findMany({
      where: whereClause,
      include: {
        product: true,
      },
      orderBy: [
        { productId: "asc" },
        { level: "asc" },
      ],
    });

    return NextResponse.json({ rebateConfigs });
  } catch (error) {
    console.error("Error fetching rebate configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch rebate configurations" },
      { status: 500 }
    );
  }
}

// POST: Create a new rebate configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create rebate configurations" },
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

    // Check if the user is an admin (for simplicity, we'll consider any user with rankId 6 as admin)
    const isAdmin = user.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to create rebate configurations" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { productId, level, rewardType, percentage, fixedAmount } = body;

    // Validate required fields
    if (!productId || !level || !rewardType) {
      return NextResponse.json(
        { error: "Missing required fields: productId, level, and rewardType" },
        { status: 400 }
      );
    }

    // Validate reward type
    if (rewardType !== "percentage" && rewardType !== "fixed") {
      return NextResponse.json(
        { error: "Invalid reward type. Must be 'percentage' or 'fixed'" },
        { status: 400 }
      );
    }

    // Validate percentage or fixed amount based on reward type
    if (rewardType === "percentage" && (percentage === undefined || percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: "Invalid percentage. Must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (rewardType === "fixed" && (fixedAmount === undefined || fixedAmount < 0)) {
      return NextResponse.json(
        { error: "Invalid fixed amount. Must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: `Product with ID ${productId} not found` },
        { status: 404 }
      );
    }

    // Check if a configuration already exists for this product and level
    const existingConfig = await prisma.rebateConfig.findUnique({
      where: {
        productId_level: {
          productId,
          level,
        },
      },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: `A configuration already exists for product ${productId} and level ${level}` },
        { status: 409 }
      );
    }

    // Create the rebate configuration
    const rebateConfig = await prisma.rebateConfig.create({
      data: {
        productId,
        level,
        rewardType,
        percentage: rewardType === "percentage" ? percentage : 0,
        fixedAmount: rewardType === "fixed" ? fixedAmount : 0,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ rebateConfig });
  } catch (error) {
    console.error("Error creating rebate configuration:", error);
    return NextResponse.json(
      { error: "Failed to create rebate configuration" },
      { status: 500 }
    );
  }
}
