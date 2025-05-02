import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view wallet transactions" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const isAdmin = false; // TODO: Add admin check

    // Get query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    let whereClause = {};
    
    if (isAdmin && userIdParam) {
      whereClause = { userId: parseInt(userIdParam) };
    } else {
      whereClause = { userId };
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's current wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    return NextResponse.json({
      balance: user?.walletBalance || 0,
      transactions,
    });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to create wallet transactions" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, type, description } = body;
    const userId = parseInt(session.user.id);

    // Only allow withdrawal transactions from the user
    if (type !== "withdrawal") {
      return NextResponse.json(
        { error: "Only withdrawal transactions are allowed" },
        { status: 400 }
      );
    }

    // Check if user has enough balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user || user.walletBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Create transaction in a transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Update user's wallet balance
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      // Create wallet transaction
      const newTransaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type,
          description: description || "Withdrawal request",
        },
      });

      return newTransaction;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating wallet transaction:", error);
    return NextResponse.json(
      { error: "Failed to create wallet transaction" },
      { status: 500 }
    );
  }
}
