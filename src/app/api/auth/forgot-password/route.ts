import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    // For security reasons, don't reveal if the user exists or not
    if (!user) {
      // Still return success to prevent email enumeration attacks
      return NextResponse.json(
        { message: "If your email is registered, you will receive a password reset link" },
        { status: 200 }
      );
    }

    // Generate a reset token
    const { token, expiresAt } = generateResetToken();

    // Save the reset token to the database
    await db.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token,
        expiresAt,
      },
      create: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, token);

    return NextResponse.json(
      { message: "If your email is registered, you will receive a password reset link" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot-password API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
