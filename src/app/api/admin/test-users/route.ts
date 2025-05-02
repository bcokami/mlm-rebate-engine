import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";

// Import the test user generator and cleanup functions
// We need to use dynamic import since these are CommonJS modules
async function importTestUserModules() {
  const generateTestUsers = (await import(path.resolve(process.cwd(), "scripts/generate-test-users.js"))).generateTestUsers;
  const cleanupTestUsers = (await import(path.resolve(process.cwd(), "scripts/cleanup-test-users.js"))).cleanupTestUsers;
  return { generateTestUsers, cleanupTestUsers };
}

// GET endpoint to retrieve test users
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin rights
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const environment = url.searchParams.get("environment") || "development";

    // Since we don't have a metadata field in the schema, we'll use a different approach
    // We'll get all users and filter them manually based on the test data file
    const testUsersData = [];
    const fs = require('fs');

    try {
      const testDataPath = path.resolve(process.cwd(), 'test-users.json');
      if (fs.existsSync(testDataPath)) {
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
        if (testData.users && Array.isArray(testData.users)) {
          testUsersData.push(...testData.users.filter(u =>
            u.isTest && u.environment === environment
          ));
        }
      }
    } catch (err) {
      console.warn('Could not read test users data file:', err);
    }

    // Get all users from the database that match the IDs in our test data
    const testUserIds = testUsersData.map(u => u.id);
    const testUsers = await prisma.user.findMany({
      where: {
        id: { in: testUserIds.length > 0 ? testUserIds : [-1] }, // Use -1 if no test users to avoid empty IN clause
      },
      select: {
        id: true,
        name: true,
        email: true,
        rankId: true,
        uplineId: true,
        walletBalance: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Add metadata to the users
    testUsers.forEach(user => {
      const testData = testUsersData.find(u => u.id === user.id);
      if (testData) {
        user.metadata = {
          role: testData.role,
          isTest: testData.isTest,
          environment: testData.environment,
          keepForDev: testData.keepForDev,
        };
      }
    });

    // Group users by role
    const usersByRole = {
      admin: testUsers.filter(user => user.metadata?.role === "admin"),
      ranked_distributor: testUsers.filter(user => user.metadata?.role === "ranked_distributor"),
      distributor: testUsers.filter(user => user.metadata?.role === "distributor"),
      viewer: testUsers.filter(user => user.metadata?.role === "viewer"),
    };

    return NextResponse.json({
      environment,
      totalCount: testUsers.length,
      usersByRole,
      users: testUsers,
    });
  } catch (error) {
    console.error("Error retrieving test users:", error);
    return NextResponse.json(
      { error: "Failed to retrieve test users" },
      { status: 500 }
    );
  }
}

// POST endpoint to generate test users
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin rights
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      environment = "development",
      userCount = 30,
      adminCount = 1,
      distributorCount = 20,
      rankedDistributorCount = 5,
      viewerCount = 4,
      maxLevels = 10,
      generatePurchases = true,
      generateRebates = true,
    } = body;

    // Import the generator function
    const { generateTestUsers } = await importTestUserModules();

    // Generate test users
    const createdUsers = await generateTestUsers({
      environment,
      userCount,
      adminCount,
      distributorCount,
      rankedDistributorCount,
      viewerCount,
      maxLevels,
      generatePurchases,
      generateRebates,
    });

    return NextResponse.json({
      message: `Successfully generated ${createdUsers.length} test users`,
      environment,
      userCount: createdUsers.length,
    });
  } catch (error) {
    console.error("Error generating test users:", error);
    return NextResponse.json(
      { error: "Failed to generate test users" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clean up test users
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin rights
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to access this endpoint" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userId = parseInt(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // For simplicity, we'll consider any user with rankId 6 (Diamond) as admin
    const isAdmin = user?.rankId === 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You must be an admin to access this endpoint" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      environment = "development",
      retainKeyTesters = true,
      dryRun = false,
    } = body;

    // Import the cleanup function
    const { cleanupTestUsers } = await importTestUserModules();

    // Clean up test users
    const result = await cleanupTestUsers({
      environment,
      retainKeyTesters,
      dryRun,
    });

    return NextResponse.json({
      message: `Successfully cleaned up test users`,
      environment,
      deleted: result.deleted,
      retained: result.retained,
      dryRun,
    });
  } catch (error) {
    console.error("Error cleaning up test users:", error);
    return NextResponse.json(
      { error: "Failed to clean up test users" },
      { status: 500 }
    );
  }
}
