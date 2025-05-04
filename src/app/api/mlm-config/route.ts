import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getMlmConfiguration, 
  updateMlmConfiguration,
  getPerformanceBonusTiers,
  createPerformanceBonusTier,
  updatePerformanceBonusTier
} from "@/lib/mlmConfigService";
import { changeStructure } from "@/lib/unifiedMlmService";
import { z } from "zod";

// Schema for configuration update
const configUpdateSchema = z.object({
  mlmStructure: z.enum(['binary', 'unilevel']).optional(),
  pvCalculation: z.enum(['percentage', 'fixed']).optional(),
  performanceBonusEnabled: z.boolean().optional(),
  monthlyCutoffDay: z.number().int().min(1).max(31).optional(),
  binaryMaxDepth: z.number().int().min(1).max(10).optional(),
  unilevelMaxDepth: z.number().int().min(1).max(10).optional(),
});

// Schema for performance bonus tier
const performanceBonusTierSchema = z.object({
  name: z.string().min(1),
  minSales: z.number().positive(),
  maxSales: z.number().positive().nullable(),
  bonusType: z.enum(['percentage', 'fixed']),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view MLM configuration" },
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
      select: { id: true, rankId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin (rank 6 or higher)
    const isAdmin = user.rankId >= 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to view MLM configuration" },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const includePerformanceTiers = url.searchParams.get("includePerformanceTiers") === "true";
    
    // Get MLM configuration
    const config = await getMlmConfiguration();
    
    // Get performance bonus tiers if requested
    let performanceTiers = null;
    if (includePerformanceTiers) {
      performanceTiers = await getPerformanceBonusTiers(false);
    }
    
    return NextResponse.json({
      config,
      performanceTiers,
    });
  } catch (error) {
    console.error("Error fetching MLM configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch MLM configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update MLM configuration" },
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
      select: { id: true, rankId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is an admin (rank 6 or higher)
    const isAdmin = user.rankId >= 6;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to update MLM configuration" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const action = body.action || 'updateConfig';
    
    switch (action) {
      case 'updateConfig':
        // Validate configuration update
        const configUpdateResult = configUpdateSchema.safeParse(body.config);
        
        if (!configUpdateResult.success) {
          return NextResponse.json(
            { error: configUpdateResult.error.errors },
            { status: 400 }
          );
        }
        
        const configUpdate = configUpdateResult.data;
        
        // Check if structure is being changed
        if (configUpdate.mlmStructure) {
          // Use the specialized function for structure change
          await changeStructure(configUpdate.mlmStructure);
        }
        
        // Update other configuration values
        const updatedConfig = await updateMlmConfiguration(configUpdate);
        
        return NextResponse.json({
          config: updatedConfig,
          message: "MLM configuration updated successfully",
        });
      
      case 'createPerformanceTier':
        // Validate performance tier
        const tierCreateResult = performanceBonusTierSchema.safeParse(body.tier);
        
        if (!tierCreateResult.success) {
          return NextResponse.json(
            { error: tierCreateResult.error.errors },
            { status: 400 }
          );
        }
        
        const newTier = tierCreateResult.data;
        
        // Create the tier
        const createdTier = await createPerformanceBonusTier({
          name: newTier.name,
          minSales: newTier.minSales,
          maxSales: newTier.maxSales,
          bonusType: newTier.bonusType,
          percentage: newTier.percentage || 0,
          fixedAmount: newTier.fixedAmount || 0,
          active: newTier.active !== undefined ? newTier.active : true,
        });
        
        return NextResponse.json({
          tier: createdTier,
          message: "Performance bonus tier created successfully",
        });
      
      case 'updatePerformanceTier':
        // Validate tier ID
        const tierId = body.tierId;
        
        if (!tierId || typeof tierId !== 'number') {
          return NextResponse.json(
            { error: "Invalid tier ID" },
            { status: 400 }
          );
        }
        
        // Validate performance tier update
        const tierUpdateResult = performanceBonusTierSchema.partial().safeParse(body.tier);
        
        if (!tierUpdateResult.success) {
          return NextResponse.json(
            { error: tierUpdateResult.error.errors },
            { status: 400 }
          );
        }
        
        const tierUpdate = tierUpdateResult.data;
        
        // Update the tier
        const updatedTier = await updatePerformanceBonusTier(tierId, tierUpdate);
        
        return NextResponse.json({
          tier: updatedTier,
          message: "Performance bonus tier updated successfully",
        });
      
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating MLM configuration:", error);
    return NextResponse.json(
      { error: "Failed to update MLM configuration" },
      { status: 500 }
    );
  }
}
