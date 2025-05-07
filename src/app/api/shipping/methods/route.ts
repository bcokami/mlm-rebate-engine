import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/methods
 * Get all active shipping methods
 */
export async function GET(request: NextRequest) {
  try {
    // Get shipping methods
    const methods = await prisma.shippingMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });
    
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching shipping methods" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/methods
 * Create a new shipping method (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You must be an admin to create shipping methods" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      price,
      estimatedDeliveryDays,
      isActive,
    } = body;
    
    // Validate required fields
    if (!name || price === undefined || estimatedDeliveryDays === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if method with same name already exists
    const existingMethod = await prisma.shippingMethod.findUnique({
      where: {
        name,
      },
    });
    
    if (existingMethod) {
      return NextResponse.json(
        { error: "A shipping method with this name already exists" },
        { status: 400 }
      );
    }
    
    // Create shipping method
    const method = await prisma.shippingMethod.create({
      data: {
        name,
        description: description || null,
        price,
        estimatedDeliveryDays,
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    
    return NextResponse.json({
      message: "Shipping method created successfully",
      method,
    });
  } catch (error) {
    console.error("Error creating shipping method:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the shipping method" },
      { status: 500 }
    );
  }
}
