import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

/**
 * GET /api/orders
 * Get all orders for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view orders" },
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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
    };

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          shippingAddress: true,
          shippingMethod: true,
          purchases: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Create a new order (supports both member and guest orders)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { isGuestOrder, customerName, customerEmail, customerPhone, guestShippingAddress } = body;

    let userId: number | null = null;

    // For member orders, verify authentication
    if (!isGuestOrder) {
      // Check authentication
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "You must be logged in to create a member order" },
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

      userId = user.id;
    } else {
      // Validate guest order data
      if (!customerName || !customerEmail || !customerPhone || !guestShippingAddress) {
        return NextResponse.json(
          { error: "Guest information is required for guest orders" },
          { status: 400 }
        );
      }
    }
    const {
      items,
      shippingAddressId,
      shippingMethodId,
      paymentMethod,
      subtotal,
      shippingFee,
      discount = 0,
      total,
      notes,
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // For member orders, shipping address ID is required
    if (!isGuestOrder && !shippingAddressId) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    if (!shippingMethodId) {
      return NextResponse.json(
        { error: "Shipping method is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // For guest orders, validate payment method
    if (isGuestOrder && paymentMethod === 'wallet') {
      return NextResponse.json(
        { error: "Wallet payment is not available for guest orders" },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order in a transaction
    const order = await prisma.$transaction(async (prisma) => {
      // For guest orders, create a shipping address first
      let shippingAddressIdToUse = shippingAddressId;

      if (isGuestOrder && guestShippingAddress) {
        const newAddress = await prisma.shippingAddress.create({
          data: {
            name: guestShippingAddress.name,
            phone: guestShippingAddress.phone,
            email: guestShippingAddress.email,
            addressLine1: guestShippingAddress.addressLine1,
            addressLine2: guestShippingAddress.addressLine2 || null,
            city: guestShippingAddress.city,
            region: guestShippingAddress.region,
            postalCode: guestShippingAddress.postalCode,
            isGuestAddress: true,
          },
        });

        shippingAddressIdToUse = newAddress.id;
      }

      // Create the order
      const newOrder = await prisma.order.create({
        data: {
          userId: userId, // Will be null for guest orders
          orderNumber,
          customerName: isGuestOrder ? customerName : null,
          customerEmail: isGuestOrder ? customerEmail : null,
          customerPhone: isGuestOrder ? customerPhone : null,
          isGuestOrder,
          subtotal,
          shippingFee,
          discount,
          total,
          status: "pending",
          paymentStatus: "pending",
          notes,
          shippingAddressId: shippingAddressIdToUse,
          shippingMethodId,
        },
      });

      // Create purchases for each item
      for (const item of items) {
        const { productId, quantity, price, priceType } = item;

        // Get product to calculate total amount
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        // Create purchase
        await prisma.purchase.create({
          data: {
            userId: userId, // Will be null for guest orders
            productId,
            quantity,
            totalAmount: price * quantity,
            priceType: priceType || "member", // "member" or "srp"
            status: "pending",
            orderId: newOrder.id,
          },
        });
      }

      // Create payment record
      await prisma.payment.create({
        data: {
          orderId: newOrder.id,
          amount: total,
          paymentMethod,
          status: paymentMethod === "cod" ? "pending" : "pending", // Could be different based on payment method
        },
      });

      return newOrder;
    });

    return NextResponse.json({
      message: "Order created successfully",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the order" },
      { status: 500 }
    );
  }
}
