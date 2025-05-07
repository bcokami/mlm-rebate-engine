import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/products/[id]/adjust-inventory
 * Adjust inventory for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to access this endpoint" },
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
    
    // Get request body
    const body = await request.json();
    
    // Validate request body
    if (body.quantity === undefined) {
      return NextResponse.json(
        { error: "Quantity is required" },
        { status: 400 }
      );
    }
    
    const quantity = parseInt(body.quantity);
    
    if (isNaN(quantity)) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }
    
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Calculate new inventory
    const newInventory = Math.max(0, product.inventory + quantity);
    
    // Update product inventory and create transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product inventory
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { inventory: newInventory },
      });
      
      // Create inventory transaction
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          quantity,
          type: quantity > 0 ? "adjustment" : "adjustment",
          notes: body.notes || null,
          createdBy: session.user.id,
          createdByName: session.user.name || null,
        },
      });
      
      // Check if inventory is below threshold and create notification if needed
      if (
        updatedProduct.lowStockThreshold !== null &&
        newInventory <= updatedProduct.lowStockThreshold &&
        product.inventory > updatedProduct.lowStockThreshold
      ) {
        // Create low stock notification
        await tx.notification.create({
          data: {
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${updatedProduct.name} is running low on stock (${newInventory} remaining)`,
            productId: updatedProduct.id,
            isRead: false,
          },
        });
      }
      
      return {
        product: updatedProduct,
        transaction,
      };
    });
    
    return NextResponse.json({
      message: "Inventory adjusted successfully",
      newInventory: result.product.inventory,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Error adjusting inventory:", error);
    return NextResponse.json(
      { error: "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}
