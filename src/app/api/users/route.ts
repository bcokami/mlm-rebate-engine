import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { userCache } from "@/lib/cache";
import { registerSchema, validate } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validation = validate(registerSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      uplineId,
      phone,
      profileImage,
      birthdate,
      address,
      city,
      region,
      postalCode,
      preferredPaymentMethod,
      bankName,
      bankAccountNumber,
      bankAccountName,
      gcashNumber,
      payMayaNumber,
      receiveUpdates
    } = validation.data!;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Validate uplineId if provided
    let parsedUplineId = null;
    if (uplineId) {
      parsedUplineId = parseInt(uplineId);

      if (isNaN(parsedUplineId)) {
        return NextResponse.json(
          { error: "Invalid upline ID" },
          { status: 400 }
        );
      }

      // Check if upline exists
      const upline = await prisma.user.findUnique({
        where: { id: parsedUplineId },
      });

      if (!upline) {
        return NextResponse.json(
          { error: "Upline user not found" },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare payment details
    const paymentDetails: Record<string, any> = {};

    if (preferredPaymentMethod === 'bank' && bankName && bankAccountNumber && bankAccountName) {
      paymentDetails.bankName = bankName;
      paymentDetails.accountNumber = bankAccountNumber;
      paymentDetails.accountName = bankAccountName;
    } else if (preferredPaymentMethod === 'gcash' && gcashNumber) {
      paymentDetails.gcashNumber = gcashNumber;
    } else if (preferredPaymentMethod === 'paymaya' && payMayaNumber) {
      paymentDetails.payMayaNumber = payMayaNumber;
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        profileImage,
        birthdate: birthdate || undefined,
        address: address || undefined,
        city: city || undefined,
        region: region || undefined,
        postalCode: postalCode || undefined,
        preferredPaymentMethod: preferredPaymentMethod || undefined,
        paymentDetails: Object.keys(paymentDetails).length > 0 ? paymentDetails : undefined,
        receiveUpdates: receiveUpdates || false,
        uplineId: parsedUplineId,
        rankId: 1, // Default rank
      },
    });

    // Clear user cache
    userCache.clearNamespace();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const rankId = url.searchParams.get("rankId");
    const uplineId = url.searchParams.get("uplineId");

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (rankId) {
      whereClause.rankId = parseInt(rankId);
    }

    if (uplineId) {
      whereClause.uplineId = parseInt(uplineId);
    }

    // Create cache key based on query parameters
    const cacheKey = `users:${page}:${pageSize}:${search}:${rankId}:${uplineId}`;

    // Try to get from cache first
    const result = await userCache.getOrSet(cacheKey, async () => {
      // Get users with pagination
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          rankId: true,
          uplineId: true,
          walletBalance: true,
          createdAt: true,
          rank: {
            select: {
              name: true,
            },
          },
          upline: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              downline: true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Get total count for pagination
      const totalUsers = await prisma.user.count({
        where: whereClause,
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalUsers / pageSize);

      return {
        users,
        pagination: {
          page,
          pageSize,
          totalItems: totalUsers,
          totalPages,
        },
      };
    }, 5 * 60 * 1000); // Cache for 5 minutes

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
