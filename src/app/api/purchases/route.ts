import { prisma } from "@/lib/prisma";
import { calculateRebates } from "@/lib/rebateCalculator";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity } = body;
    const userId = parseInt(session.user.id);

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = product.price * quantity;

    // Create purchase in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create the purchase
      const newPurchase = await tx.purchase.create({
        data: {
          userId,
          productId,
          quantity,
          totalAmount,
        },
      });

      return newPurchase;
    });

    // Calculate and create rebates
    await calculateRebates(purchase.id, userId, productId, totalAmount);

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view purchases" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const isAdmin = false; // TODO: Add admin check

    // Get query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    let whereClause = {};
    
    if (isAdmin && userIdParam) {
      whereClause = { userId: parseInt(userIdParam) };
    } else {
      whereClause = { userId };
    }

    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rebates: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
