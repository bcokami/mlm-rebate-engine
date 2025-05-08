import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for payment details update
const paymentDetailsSchema = z.object({
  preferredPaymentMethod: z.enum(["bank", "gcash", "paymaya"]),
  paymentDetails: z.record(z.string(), z.any()),
});

/**
 * GET /api/users/[id]/payment-details
 * Get payment details for a user
 */
export async function GET(
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
    
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Check if the user is requesting their own data or is an admin
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    
    if (!requestingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (requestingUser.id !== userId && requestingUser.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to access this data" },
        { status: 403 }
      );
    }
    
    // Get user payment details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        preferredPaymentMethod: true,
        paymentDetails: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]/payment-details
 * Update payment details for a user
 */
export async function PATCH(
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
    
    const userId = parseInt(params.id);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }
    
    // Check if the user is updating their own data or is an admin
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    
    if (!requestingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (requestingUser.id !== userId && requestingUser.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to update this data" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate request body
    const validation = paymentDetailsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { preferredPaymentMethod, paymentDetails } = validation.data;
    
    // Validate payment details based on payment method
    if (preferredPaymentMethod === "bank") {
      if (!paymentDetails.bankName || !paymentDetails.accountNumber || !paymentDetails.accountName) {
        return NextResponse.json(
          { error: "Bank details are incomplete" },
          { status: 400 }
        );
      }
    } else if (preferredPaymentMethod === "gcash") {
      if (!paymentDetails.gcashNumber) {
        return NextResponse.json(
          { error: "GCash number is required" },
          { status: 400 }
        );
      }
      
      if (!/^\d{11}$/.test(paymentDetails.gcashNumber)) {
        return NextResponse.json(
          { error: "Invalid GCash number format" },
          { status: 400 }
        );
      }
    } else if (preferredPaymentMethod === "paymaya") {
      if (!paymentDetails.payMayaNumber) {
        return NextResponse.json(
          { error: "PayMaya number is required" },
          { status: 400 }
        );
      }
      
      if (!/^\d{11}$/.test(paymentDetails.payMayaNumber)) {
        return NextResponse.json(
          { error: "Invalid PayMaya number format" },
          { status: 400 }
        );
      }
    }
    
    // Update user payment details
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        preferredPaymentMethod,
        paymentDetails,
      },
      select: {
        id: true,
        preferredPaymentMethod: true,
        paymentDetails: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating payment details:", error);
    return NextResponse.json(
      { error: "Failed to update payment details" },
      { status: 500 }
    );
  }
}
