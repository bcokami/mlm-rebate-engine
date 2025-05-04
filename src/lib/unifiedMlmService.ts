import { prisma } from "./prisma";
import { getMlmConfiguration, MlmStructureType } from "./mlmConfigService";
import * as binaryMlmService from "./binaryMlmService";
import * as unilevelMlmService from "./unilevelMlmService";

/**
 * Calculate commissions based on the current MLM structure
 * 
 * @param userId The ID of the user
 * @param startDate Start date for the calculation period
 * @param endDate End date for the calculation period
 * @returns Commission calculation results
 */
export async function calculateCommissions(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<any> {
  // Get the current MLM configuration
  const config = await getMlmConfiguration();
  
  // Calculate commissions based on the structure
  if (config.mlmStructure === 'binary') {
    return await binaryMlmService.calculateCommissions(userId, startDate, endDate);
  } else {
    return await unilevelMlmService.calculateCommissions(userId, startDate, endDate);
  }
}

/**
 * Build a tree structure based on the current MLM structure
 * 
 * @param userId The ID of the user
 * @param maxDepth Maximum depth of the tree
 * @returns Tree structure
 */
export async function buildTree(
  userId: number,
  maxDepth?: number
): Promise<any> {
  // Get the current MLM configuration
  const config = await getMlmConfiguration();
  
  // Set default max depth based on configuration
  if (maxDepth === undefined) {
    maxDepth = config.mlmStructure === 'binary' 
      ? config.binaryMaxDepth 
      : config.unilevelMaxDepth;
  }
  
  // Build tree based on the structure
  if (config.mlmStructure === 'binary') {
    return await binaryMlmService.buildBinaryTree(userId, maxDepth);
  } else {
    return await unilevelMlmService.buildUnilevelTree(userId, maxDepth);
  }
}

/**
 * Get downline users by level based on the current MLM structure
 * 
 * @param userId The ID of the user
 * @param maxLevel Maximum level to retrieve
 * @returns Downline users with their levels
 */
export async function getDownlineByLevel(
  userId: number,
  maxLevel?: number
): Promise<any> {
  // Get the current MLM configuration
  const config = await getMlmConfiguration();
  
  // Set default max level based on configuration
  if (maxLevel === undefined) {
    maxLevel = config.mlmStructure === 'binary' 
      ? config.binaryMaxDepth 
      : config.unilevelMaxDepth;
  }
  
  // Get downline based on the structure
  if (config.mlmStructure === 'binary') {
    return await binaryMlmService.getDownlineByLevel(userId, maxLevel);
  } else {
    return await unilevelMlmService.getDownlineByLevel(userId, maxLevel);
  }
}

/**
 * Simulate earnings for a user for a specific month
 * 
 * @param userId The ID of the user
 * @param year Year
 * @param month Month (1-12)
 * @returns Simulated earnings
 */
export async function simulateEarnings(
  userId: number,
  year: number,
  month: number
): Promise<any> {
  // Get the current MLM configuration
  const config = await getMlmConfiguration();
  
  // Simulate earnings based on the structure
  if (config.mlmStructure === 'binary') {
    return await binaryMlmService.simulateEarnings(userId, year, month);
  } else {
    return await unilevelMlmService.simulateEarnings(userId, year, month);
  }
}

/**
 * Change the MLM structure
 * 
 * @param structure New MLM structure
 * @returns Updated configuration
 */
export async function changeStructure(structure: MlmStructureType): Promise<any> {
  // Update the configuration in the database
  await prisma.systemConfig.update({
    where: { key: 'mlm_structure' },
    data: { value: structure, updatedAt: new Date() },
  });
  
  // Return the updated configuration
  return await getMlmConfiguration();
}

/**
 * Process monthly cutoff
 * 
 * @param year Year
 * @param month Month (1-12)
 * @returns Processing result
 */
export async function processMonthlyCommissions(
  year: number,
  month: number
): Promise<any> {
  try {
    // Get the cutoff record
    const cutoff = await prisma.monthlyCutoff.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
    });
    
    if (!cutoff) {
      throw new Error(`No cutoff record found for ${year}-${month}`);
    }
    
    // Update cutoff status
    await prisma.monthlyCutoff.update({
      where: { id: cutoff.id },
      data: {
        status: 'processing',
        updatedAt: new Date(),
      },
    });
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Process each user
    const results = [];
    
    for (const user of users) {
      try {
        // Simulate earnings for the user
        const earnings = await simulateEarnings(user.id, year, month);
        
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          earnings,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }
    
    // Update cutoff status
    await prisma.monthlyCutoff.update({
      where: { id: cutoff.id },
      data: {
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
        notes: `Processed ${results.length} users. ${results.filter(r => r.success).length} succeeded, ${results.filter(r => !r.success).length} failed.`,
      },
    });
    
    return {
      cutoff,
      results,
      summary: {
        totalUsers: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    };
  } catch (error) {
    console.error(`Error processing monthly commissions for ${year}-${month}:`, error);
    
    // Update cutoff status
    await prisma.monthlyCutoff.update({
      where: {
        year_month: {
          year,
          month,
        },
      },
      data: {
        status: 'failed',
        updatedAt: new Date(),
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
    
    throw error;
  }
}
