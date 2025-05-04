import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getAllPaymentMethods,
  getUserPaymentMethods
} from "@/lib/paymentMethodService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view payment methods" },
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

    // Get query parameters
    const url = new URL(request.url);
    const includeUserMethods = url.searchParams.get("includeUserMethods") === "true";
    
    // Get all payment methods
    const paymentMethods = await getAllPaymentMethods(true);
    
    // Get user payment methods if requested
    let userPaymentMethods = null;
    if (includeUserMethods) {
      userPaymentMethods = await getUserPaymentMethods(user.id);
    }
    
    return NextResponse.json({
      paymentMethods,
      userPaymentMethods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}
