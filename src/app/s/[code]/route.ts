import { NextRequest, NextResponse } from "next/server";
import { getShareableLinkByCode, recordLinkClick } from "@/lib/shareableLinkService";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Get the link
    const link = await getShareableLinkByCode(code);

    if (!link) {
      return new NextResponse("Link not found", { status: 404 });
    }

    if (!link.isActive) {
      return new NextResponse("This link is no longer active", { status: 400 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return new NextResponse("This link has expired", { status: 400 });
    }

    // Get request information
    const headers = request.headers;
    const userAgent = headers.get("user-agent");
    const referer = headers.get("referer");
    const ip = headers.get("x-forwarded-for") || "unknown";
    
    // Get UTM parameters from the request
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    // Record the click
    await recordLinkClick(link.id, {
      ipAddress: ip,
      userAgent: userAgent || undefined,
      referrer: referer || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    });

    // Determine redirect URL
    let redirectUrl = "/";

    if (link.type === "product" && link.productId) {
      // Redirect to product page with referral code
      redirectUrl = `/shop/product/${link.productId}?ref=${code}`;
    }

    // Redirect to the appropriate page
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("Error processing shareable link:", error);
    return new NextResponse("An error occurred", { status: 500 });
  }
}
