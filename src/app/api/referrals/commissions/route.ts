import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserReferralCommissions } from "@/lib/shareableLinkService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view referral commissions" },
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
    const statusParam = url.searchParams.get("status");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    
    // Build options
    const options: any = {};
    
    if (statusParam) {
      options.status = statusParam;
    }
    
    if (limitParam) {
      options.limit = parseInt(limitParam);
    }
    
    if (offsetParam) {
      options.offset = parseInt(offsetParam);
    }
    
    // Get user's referral commissions
    const { commissions, total } = await getUserReferralCommissions(user.id, options);
    
    return NextResponse.json({
      commissions,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching referral commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral commissions" },
      { status: 500 }
    );
  }
}
