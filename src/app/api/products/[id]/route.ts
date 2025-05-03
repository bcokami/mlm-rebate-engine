import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get a single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        rebateConfigs: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "You do not have permission to perform this action" },
        { status: 403 }
      );
    }

    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
      },
    });

    // Update rebate configurations
    if (data.rebateConfigs && Array.isArray(data.rebateConfigs)) {
      // Delete existing rebate configs
      await prisma.productRebateConfig.deleteMany({
        where: { productId },
      });

      // Create new rebate configs
      const rebateConfigs = await Promise.all(
        data.rebateConfigs.map((config: any) =>
          prisma.productRebateConfig.create({
            data: {
              productId,
              level: config.level,
              percentage: config.percentage,
            },
          })
        )
      );

      // Return the updated product with rebate configs
      return NextResponse.json({
        ...updatedProduct,
        rebateConfigs,
      });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "You do not have permission to perform this action" },
        { status: 403 }
      );
    }

    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if the product is used in any purchases
    const purchaseCount = await prisma.purchase.count({
      where: { productId },
    });

    if (purchaseCount > 0) {
      // If the product is used in purchases, we'll just deactivate it instead of deleting
      const deactivatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Product has existing purchases and cannot be deleted. It has been deactivated instead.",
        product: deactivatedProduct,
      });
    }

    // Delete rebate configurations first
    await prisma.productRebateConfig.deleteMany({
      where: { productId },
    });

    // Delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
