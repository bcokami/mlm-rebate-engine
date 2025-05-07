import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cleanupTestData } from "@/lib/testDataGenerator";

/**
 * POST /api/admin/test-data/cleanup
 * Clean up test data
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "You do not have permission to access this endpoint" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate request body
    if (!body.cleanupToken) {
      return NextResponse.json(
        { error: "Cleanup token is required" },
        { status: 400 }
      );
    }
    
    // Clean up test data
    const result = await cleanupTestData(body.cleanupToken);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    return NextResponse.json(
      { error: "Failed to clean up test data" },
      { status: 500 }
    );
  }
}
