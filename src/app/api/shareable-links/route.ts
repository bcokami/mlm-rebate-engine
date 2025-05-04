import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  createProductShareableLink,
  getUserShareableLinks,
  updateShareableLink,
  deleteShareableLink,
  getUserReferralStats
} from "@/lib/shareableLinkService";
import { z } from "zod";

// Schema for creating a shareable link
const createLinkSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  customImage: z.string().optional(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// Schema for updating a shareable link
const updateLinkSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  customImage: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view shareable links" },
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
    const productIdParam = url.searchParams.get("productId");
    const typeParam = url.searchParams.get("type");
    const isActiveParam = url.searchParams.get("isActive");
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const includeStats = url.searchParams.get("includeStats") === "true";
    
    // Build options
    const options: any = {};
    
    if (productIdParam) {
      options.productId = parseInt(productIdParam);
    }
    
    if (typeParam) {
      options.type = typeParam;
    }
    
    if (isActiveParam !== null) {
      options.isActive = isActiveParam === "true";
    }
    
    if (limitParam) {
      options.limit = parseInt(limitParam);
    }
    
    if (offsetParam) {
      options.offset = parseInt(offsetParam);
    }
    
    // Get user's shareable links
    const { links, total } = await getUserShareableLinks(user.id, options);
    
    // Get referral stats if requested
    let stats = null;
    if (includeStats) {
      stats = await getUserReferralStats(user.id);
    }
    
    return NextResponse.json({
      links,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset || 0,
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching shareable links:", error);
    return NextResponse.json(
      { error: "Failed to fetch shareable links" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a shareable link" },
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
    const validationResult = createLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { productId, title, description, customImage, expiresAt } = validationResult.data;

    // Check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Create the shareable link
    const link = await createProductShareableLink(user.id, productId, {
      title,
      description,
      customImage,
      expiresAt,
    });

    return NextResponse.json({
      link,
      message: "Shareable link created successfully",
    });
  } catch (error) {
    console.error("Error creating shareable link:", error);
    return NextResponse.json(
      { error: "Failed to create shareable link" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update a shareable link" },
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
    const validationResult = updateLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { id, title, description, customImage, isActive, expiresAt } = validationResult.data;

    // Check if the link exists and belongs to the user
    const existingLink = await prisma.shareableLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: "Shareable link not found" },
        { status: 404 }
      );
    }

    if (existingLink.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this link" },
        { status: 403 }
      );
    }

    // Update the link
    const updatedLink = await updateShareableLink(id, {
      title,
      description,
      customImage,
      isActive,
      expiresAt,
    });

    return NextResponse.json({
      link: updatedLink,
      message: "Shareable link updated successfully",
    });
  } catch (error) {
    console.error("Error updating shareable link:", error);
    return NextResponse.json(
      { error: "Failed to update shareable link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a shareable link" },
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

    // Get the link ID from the URL
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam);

    // Check if the link exists and belongs to the user
    const existingLink = await prisma.shareableLink.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return NextResponse.json(
        { error: "Shareable link not found" },
        { status: 404 }
      );
    }

    if (existingLink.userId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this link" },
        { status: 403 }
      );
    }

    // Delete the link
    await deleteShareableLink(id);

    return NextResponse.json({
      message: "Shareable link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shareable link:", error);
    return NextResponse.json(
      { error: "Failed to delete shareable link" },
      { status: 500 }
    );
  }
}
