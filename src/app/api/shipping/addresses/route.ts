import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/shipping/addresses
 * Get all shipping addresses for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view shipping addresses" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get shipping addresses
    const addresses = await prisma.shippingAddress.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });
    
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching shipping addresses:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching shipping addresses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/addresses
 * Create a new shipping address
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a shipping address" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      isDefault,
    } = body;
    
    // Validate required fields
    if (!name || !phone || !addressLine1 || !city || !region || !postalCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // If this address is set as default, unset any existing default address
    if (isDefault) {
      await prisma.shippingAddress.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }
    
    // Create shipping address
    const address = await prisma.shippingAddress.create({
      data: {
        userId: user.id,
        name,
        phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        region,
        postalCode,
        isDefault: isDefault || false,
      },
    });
    
    return NextResponse.json({
      message: "Shipping address created successfully",
      address,
    });
  } catch (error) {
    console.error("Error creating shipping address:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the shipping address" },
      { status: 500 }
    );
  }
}
