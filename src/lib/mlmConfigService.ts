import { prisma } from "./prisma";

/**
 * MLM structure types
 */
export type MlmStructureType = 'binary' | 'unilevel';

/**
 * PV calculation methods
 */
export type PvCalculationMethod = 'percentage' | 'fixed';

/**
 * MLM configuration interface
 */
export interface MlmConfiguration {
  mlmStructure: MlmStructureType;
  pvCalculation: PvCalculationMethod;
  performanceBonusEnabled: boolean;
  monthlyCutoffDay: number;
  binaryMaxDepth: number;
  unilevelMaxDepth: number;
}

/**
 * Performance bonus tier interface
 */
export interface PerformanceBonusTier {
  id: number;
  name: string;
  minSales: number;
  maxSales: number | null;
  bonusType: 'percentage' | 'fixed';
  percentage: number;
  fixedAmount: number;
  active: boolean;
}

/**
 * Monthly cutoff interface
 */
export interface MonthlyCutoff {
  id: number;
  year: number;
  month: number;
  cutoffDay: number;
  processedAt: Date | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes: string | null;
}

/**
 * Get the current MLM configuration
 * 
 * @returns MLM configuration
 */
export async function getMlmConfiguration(): Promise<MlmConfiguration> {
  // Get all configuration values
  const configValues = await prisma.systemConfig.findMany();
  
  // Convert to a map for easier access
  const configMap = configValues.reduce((map, config) => {
    map[config.key] = config.value;
    return map;
  }, {} as Record<string, string>);
  
  // Return the configuration object
  return {
    mlmStructure: (configMap.mlm_structure || 'binary') as MlmStructureType,
    pvCalculation: (configMap.pv_calculation || 'percentage') as PvCalculationMethod,
    performanceBonusEnabled: configMap.performance_bonus_enabled === 'true',
    monthlyCutoffDay: parseInt(configMap.monthly_cutoff_day || '25'),
    binaryMaxDepth: parseInt(configMap.binary_max_depth || '6'),
    unilevelMaxDepth: parseInt(configMap.unilevel_max_depth || '6'),
  };
}

/**
 * Update the MLM configuration
 * 
 * @param config Configuration values to update
 * @returns Updated configuration
 */
export async function updateMlmConfiguration(config: Partial<MlmConfiguration>): Promise<MlmConfiguration> {
  // Convert configuration object to key-value pairs
  const updates = [];
  
  if (config.mlmStructure !== undefined) {
    updates.push({ key: 'mlm_structure', value: config.mlmStructure });
  }
  
  if (config.pvCalculation !== undefined) {
    updates.push({ key: 'pv_calculation', value: config.pvCalculation });
  }
  
  if (config.performanceBonusEnabled !== undefined) {
    updates.push({ key: 'performance_bonus_enabled', value: config.performanceBonusEnabled.toString() });
  }
  
  if (config.monthlyCutoffDay !== undefined) {
    updates.push({ key: 'monthly_cutoff_day', value: config.monthlyCutoffDay.toString() });
  }
  
  if (config.binaryMaxDepth !== undefined) {
    updates.push({ key: 'binary_max_depth', value: config.binaryMaxDepth.toString() });
  }
  
  if (config.unilevelMaxDepth !== undefined) {
    updates.push({ key: 'unilevel_max_depth', value: config.unilevelMaxDepth.toString() });
  }
  
  // Update each configuration value
  for (const update of updates) {
    await prisma.systemConfig.update({
      where: { key: update.key },
      data: { value: update.value, updatedAt: new Date() },
    });
  }
  
  // Return the updated configuration
  return await getMlmConfiguration();
}

/**
 * Get performance bonus tiers
 * 
 * @param activeOnly Whether to return only active tiers
 * @returns Performance bonus tiers
 */
export async function getPerformanceBonusTiers(activeOnly: boolean = true): Promise<PerformanceBonusTier[]> {
  return await prisma.performanceBonusTier.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { minSales: 'asc' },
  });
}

/**
 * Create a performance bonus tier
 * 
 * @param tier Performance bonus tier data
 * @returns Created tier
 */
export async function createPerformanceBonusTier(tier: Omit<PerformanceBonusTier, 'id'>): Promise<PerformanceBonusTier> {
  return await prisma.performanceBonusTier.create({
    data: tier,
  });
}

/**
 * Update a performance bonus tier
 * 
 * @param id Tier ID
 * @param tier Performance bonus tier data
 * @returns Updated tier
 */
export async function updatePerformanceBonusTier(
  id: number,
  tier: Partial<Omit<PerformanceBonusTier, 'id'>>
): Promise<PerformanceBonusTier> {
  return await prisma.performanceBonusTier.update({
    where: { id },
    data: {
      ...tier,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get monthly cutoffs
 * 
 * @param year Optional year filter
 * @param month Optional month filter
 * @returns Monthly cutoffs
 */
export async function getMonthlyCutoffs(year?: number, month?: number): Promise<MonthlyCutoff[]> {
  const where: any = {};
  
  if (year !== undefined) {
    where.year = year;
  }
  
  if (month !== undefined) {
    where.month = month;
  }
  
  return await prisma.monthlyCutoff.findMany({
    where,
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });
}

/**
 * Create a monthly cutoff
 * 
 * @param cutoff Monthly cutoff data
 * @returns Created cutoff
 */
export async function createMonthlyCutoff(
  cutoff: Pick<MonthlyCutoff, 'year' | 'month' | 'cutoffDay' | 'notes'>
): Promise<MonthlyCutoff> {
  // Check if a cutoff already exists for this year and month
  const existing = await prisma.monthlyCutoff.findUnique({
    where: {
      year_month: {
        year: cutoff.year,
        month: cutoff.month,
      },
    },
  });
  
  if (existing) {
    throw new Error(`A cutoff already exists for ${cutoff.year}-${cutoff.month}`);
  }
  
  return await prisma.monthlyCutoff.create({
    data: {
      year: cutoff.year,
      month: cutoff.month,
      cutoffDay: cutoff.cutoffDay,
      notes: cutoff.notes,
      status: 'pending',
    },
  });
}

/**
 * Update a monthly cutoff
 * 
 * @param id Cutoff ID
 * @param cutoff Monthly cutoff data
 * @returns Updated cutoff
 */
export async function updateMonthlyCutoff(
  id: number,
  cutoff: Partial<Omit<MonthlyCutoff, 'id' | 'year' | 'month'>>
): Promise<MonthlyCutoff> {
  return await prisma.monthlyCutoff.update({
    where: { id },
    data: {
      ...cutoff,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get the current or upcoming monthly cutoff
 * 
 * @returns Current or upcoming monthly cutoff
 */
export async function getCurrentMonthlyCutoff(): Promise<MonthlyCutoff | null> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Try to find a cutoff for the current month
  let cutoff = await prisma.monthlyCutoff.findUnique({
    where: {
      year_month: {
        year: currentYear,
        month: currentMonth,
      },
    },
  });
  
  if (cutoff) {
    return cutoff;
  }
  
  // If no cutoff for the current month, try to find the next upcoming cutoff
  cutoff = await prisma.monthlyCutoff.findFirst({
    where: {
      OR: [
        { year: currentYear, month: { gt: currentMonth } },
        { year: { gt: currentYear } },
      ],
    },
    orderBy: [
      { year: 'asc' },
      { month: 'asc' },
    ],
  });
  
  return cutoff;
}

/**
 * Calculate PV (Point Value) based on the current configuration
 * 
 * @param price Product price
 * @param productPv Product PV (used for fixed calculation)
 * @returns Calculated PV
 */
export async function calculatePv(price: number, productPv: number): Promise<number> {
  const config = await getMlmConfiguration();
  
  if (config.pvCalculation === 'fixed') {
    return productPv;
  } else {
    // For percentage calculation, PV is a percentage of the price
    // This is just an example - you might want to adjust this formula
    return price * 0.5; // 50% of price as PV
  }
}

/**
 * Calculate performance bonus based on sales amount
 * 
 * @param salesAmount Total sales amount
 * @returns Bonus amount
 */
export async function calculatePerformanceBonus(salesAmount: number): Promise<number> {
  const config = await getMlmConfiguration();
  
  if (!config.performanceBonusEnabled) {
    return 0;
  }
  
  // Get active performance bonus tiers
  const tiers = await getPerformanceBonusTiers(true);
  
  // Find the applicable tier
  const applicableTier = tiers.find(tier => 
    salesAmount >= tier.minSales && 
    (tier.maxSales === null || salesAmount <= tier.maxSales)
  );
  
  if (!applicableTier) {
    return 0;
  }
  
  // Calculate bonus based on tier type
  if (applicableTier.bonusType === 'percentage') {
    return salesAmount * (applicableTier.percentage / 100);
  } else {
    return applicableTier.fixedAmount;
  }
}
