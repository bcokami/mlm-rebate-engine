import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generateTestData, TestScenario } from "@/lib/testDataGenerator";

/**
 * POST /api/admin/test-data/generate
 * Generate test data for testing purposes
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
    if (!body.scenario) {
      return NextResponse.json(
        { error: "Scenario is required" },
        { status: 400 }
      );
    }
    
    // Validate scenario
    if (!Object.values(TestScenario).includes(body.scenario)) {
      return NextResponse.json(
        { error: "Invalid scenario" },
        { status: 400 }
      );
    }
    
    // Validate count
    const count = parseInt(body.count) || 1;
    if (count < 1 || count > 10) {
      return NextResponse.json(
        { error: "Count must be between 1 and 10" },
        { status: 400 }
      );
    }
    
    // Generate test data
    const result = await generateTestData({
      scenario: body.scenario,
      count,
      prefix: body.prefix || "test",
      cleanupToken: body.cleanupToken || `cleanup_${Date.now()}`,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating test data:", error);
    return NextResponse.json(
      { error: "Failed to generate test data" },
      { status: 500 }
    );
  }
}
