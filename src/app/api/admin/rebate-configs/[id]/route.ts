import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Get a specific rebate configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);

    // Get the rebate configuration
    const rebateConfig = await prisma.rebateConfig.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!rebateConfig) {
      return NextResponse.json(
        { error: `Rebate configuration with ID ${id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ rebateConfig });
  } catch (error) {
    console.error("Error fetching rebate configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch rebate configuration" },
      { status: 500 }
    );
  }
}

// PUT: Update a rebate configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update rebate configurations" },
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
        { error: "You do not have permission to update rebate configurations" },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);

    // Check if the rebate configuration exists
    const existingConfig = await prisma.rebateConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: `Rebate configuration with ID ${id} not found` },
        { status: 404 }
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

    // Check if another configuration already exists for this product and level
    if (productId !== existingConfig.productId || level !== existingConfig.level) {
      const conflictingConfig = await prisma.rebateConfig.findUnique({
        where: {
          productId_level: {
            productId,
            level,
          },
        },
      });

      if (conflictingConfig && conflictingConfig.id !== id) {
        return NextResponse.json(
          { error: `A configuration already exists for product ${productId} and level ${level}` },
          { status: 409 }
        );
      }
    }

    // Update the rebate configuration
    const updatedConfig = await prisma.rebateConfig.update({
      where: { id },
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

    return NextResponse.json({ rebateConfig: updatedConfig });
  } catch (error) {
    console.error("Error updating rebate configuration:", error);
    return NextResponse.json(
      { error: "Failed to update rebate configuration" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a rebate configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete rebate configurations" },
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
        { error: "You do not have permission to delete rebate configurations" },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);

    // Check if the rebate configuration exists
    const existingConfig = await prisma.rebateConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: `Rebate configuration with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Delete the rebate configuration
    await prisma.rebateConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rebate configuration:", error);
    return NextResponse.json(
      { error: "Failed to delete rebate configuration" },
      { status: 500 }
    );
  }
}
