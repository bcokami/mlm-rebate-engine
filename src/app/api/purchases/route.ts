import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { purchaseSchema } from "@/lib/validation";
import { createPurchase, getUserPurchases } from "@/lib/purchaseService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = purchaseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      productId,
      quantity,
      paymentMethodId,
      paymentDetails,
      referenceNumber,
      shippingMethodId,
      shippingDetails,
      shippingAddress,
      shippingFee,
      referralCode
    } = body;

    const userId = parseInt(session.user.id);

    // Check for referral code
    let referralLinkId = null;
    let referralSource = null;
    let referralData = null;

    if (referralCode) {
      // Get the shareable link
      const { getShareableLinkByCode } = await import("@/lib/shareableLinkService");
      const link = await getShareableLinkByCode(referralCode);

      if (link) {
        // Make sure the user is not referring themselves
        if (link.userId !== userId) {
          referralLinkId = link.id;
          referralSource = "link";
          referralData = JSON.stringify({
            code: referralCode,
            referrerId: link.userId,
          });
        }
      }
    }

    // Create the purchase using the service
    const result = await createPurchase({
      userId,
      productId,
      quantity,
      paymentMethodId,
      paymentDetails,
      referenceNumber,
      shippingMethodId,
      shippingDetails,
      shippingAddress,
      shippingFee,
      referralLinkId,
      referralSource,
      referralData,
    });

    // Process referral commission if applicable
    if (referralLinkId) {
      try {
        const { recordReferralPurchase } = await import("@/lib/shareableLinkService");
        await recordReferralPurchase(result.purchase.id, referralLinkId);
      } catch (error) {
        console.error("Error processing referral commission:", error);
        // Don't fail the purchase if commission processing fails
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create purchase" },
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
    const isAdmin = session.user.role === 'admin'; // Check if user is admin

    // Get query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const limit = limitParam ? parseInt(limitParam) : 10;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    // Determine which user's purchases to fetch
    let targetUserId = userId;
    if (isAdmin && userIdParam) {
      targetUserId = parseInt(userIdParam);
    }

    // Get the user's purchases with pagination
    const result = await getUserPurchases(targetUserId, limit, offset);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchases" },
      { status: 500 }
    );
  }
}
