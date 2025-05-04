import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { 
  getShareableLinkByCode,
  recordLinkClick
} from "@/lib/shareableLinkService";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Link code is required" },
        { status: 400 }
      );
    }

    // Get the link
    const link = await getShareableLinkByCode(code);

    if (!link) {
      return NextResponse.json(
        { error: "Shareable link not found" },
        { status: 404 }
      );
    }

    if (!link.isActive) {
      return NextResponse.json(
        { error: "This link is no longer active" },
        { status: 400 }
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 400 }
      );
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

    // Get product information if this is a product link
    let product = null;
    if (link.productId) {
      product = await prisma.product.findUnique({
        where: { id: link.productId },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
        },
      });
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: link.userId },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      link: {
        id: link.id,
        code: link.code,
        type: link.type,
        title: link.title || (product ? product.name : null),
        description: link.description || (product ? product.description : null),
        image: link.customImage || (product ? product.image : null),
      },
      product,
      sharedBy: user,
      message: "Click recorded successfully",
    });
  } catch (error) {
    console.error("Error recording link click:", error);
    return NextResponse.json(
      { error: "Failed to record link click" },
      { status: 500 }
    );
  }
}
