import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getUserPaymentMethods,
  addUserPaymentMethod,
  updateUserPaymentMethod,
  deleteUserPaymentMethod,
  setDefaultUserPaymentMethod,
  getPaymentMethodById,
  validatePaymentDetails
} from "@/lib/paymentMethodService";
import { z } from "zod";

// Schema for adding a payment method
const addPaymentMethodSchema = z.object({
  paymentMethodId: z.number().int().positive(),
  details: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

// Schema for updating a payment method
const updatePaymentMethodSchema = z.object({
  id: z.number().int().positive(),
  details: z.record(z.any()).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your payment methods" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user payment methods
    const userPaymentMethods = await getUserPaymentMethods(user.id);
    
    return NextResponse.json({
      userPaymentMethods,
    });
  } catch (error) {
    console.error("Error fetching user payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch user payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to add a payment method" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addPaymentMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { paymentMethodId, details, isDefault } = validationResult.data;

    // Get the payment method
    const paymentMethod = await getPaymentMethodById(paymentMethodId);

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (!paymentMethod.isActive) {
      return NextResponse.json(
        { error: "Payment method is not active" },
        { status: 400 }
      );
    }

    // Validate payment details if required
    if (paymentMethod.requiresDetails) {
      const detailsValidation = await validatePaymentDetails(paymentMethodId, details || {});

      if (!detailsValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid payment details: ${detailsValidation.errors?.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Add the payment method
    const userPaymentMethod = await addUserPaymentMethod(
      user.id,
      paymentMethodId,
      details ? JSON.stringify(details) : '{}',
      isDefault || false
    );

    return NextResponse.json({
      userPaymentMethod,
      message: "Payment method added successfully",
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update a payment method" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePaymentMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { id, details, isDefault } = validationResult.data;

    // Check if the payment method belongs to the user
    const existingMethod = await prisma.userPaymentMethod.findUnique({
      where: { id },
      include: { paymentMethod: true },
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (existingMethod.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this payment method" },
        { status: 403 }
      );
    }

    // Validate payment details if provided and required
    if (details && existingMethod.paymentMethod.requiresDetails) {
      const detailsValidation = await validatePaymentDetails(
        existingMethod.paymentMethodId,
        details
      );

      if (!detailsValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid payment details: ${detailsValidation.errors?.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update the payment method
    const updatedMethod = await updateUserPaymentMethod(
      id,
      details ? JSON.stringify(details) : undefined,
      isDefault
    );

    return NextResponse.json({
      userPaymentMethod: updatedMethod,
      message: "Payment method updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a payment method" },
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found in session" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the payment method ID from the URL
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam);

    // Check if the payment method belongs to the user
    const existingMethod = await prisma.userPaymentMethod.findUnique({
      where: { id },
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (existingMethod.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this payment method" },
        { status: 403 }
      );
    }

    // Delete the payment method
    await deleteUserPaymentMethod(id);

    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
