import { prisma } from "./prisma";
import { nanoid } from "nanoid";

/**
 * Interface for shareable link
 */
export interface ShareableLink {
  id: number;
  userId: number;
  productId: number | null;
  code: string;
  type: string;
  title: string | null;
  description: string | null;
  customImage: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  clickCount: number;
  conversionCount: number;
  totalRevenue: number;
  totalCommission: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for link click
 */
export interface LinkClick {
  id: number;
  linkId: number;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: Date;
}

/**
 * Interface for referral commission
 */
export interface ReferralCommission {
  id: number;
  purchaseId: number;
  linkId: number;
  referrerId: number;
  buyerId: number;
  productId: number;
  amount: number;
  percentage: number;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a unique code for a shareable link
 * 
 * @returns Unique code
 */
export async function generateUniqueCode(): Promise<string> {
  // Generate a short unique code
  let code = nanoid(8);
  let isUnique = false;
  
  // Check if the code is unique
  while (!isUnique) {
    const existingLink = await prisma.shareableLink.findUnique({
      where: { code },
    });
    
    if (!existingLink) {
      isUnique = true;
    } else {
      code = nanoid(8);
    }
  }
  
  return code;
}

/**
 * Create a shareable link for a product
 * 
 * @param userId User ID
 * @param productId Product ID
 * @param options Additional options
 * @returns Created shareable link
 */
export async function createProductShareableLink(
  userId: number,
  productId: number,
  options?: {
    title?: string;
    description?: string;
    customImage?: string;
    expiresAt?: Date;
  }
): Promise<ShareableLink> {
  // Generate a unique code
  const code = await generateUniqueCode();
  
  // Create the shareable link
  return await prisma.shareableLink.create({
    data: {
      userId,
      productId,
      code,
      type: "product",
      title: options?.title,
      description: options?.description,
      customImage: options?.customImage,
      expiresAt: options?.expiresAt,
      isActive: true,
    },
  });
}

/**
 * Get a shareable link by code
 * 
 * @param code Link code
 * @returns Shareable link or null if not found
 */
export async function getShareableLinkByCode(code: string): Promise<ShareableLink | null> {
  return await prisma.shareableLink.findUnique({
    where: { code },
  });
}

/**
 * Get a shareable link by ID
 * 
 * @param id Link ID
 * @returns Shareable link or null if not found
 */
export async function getShareableLinkById(id: number): Promise<ShareableLink | null> {
  return await prisma.shareableLink.findUnique({
    where: { id },
  });
}

/**
 * Get shareable links for a user
 * 
 * @param userId User ID
 * @param options Query options
 * @returns List of shareable links
 */
export async function getUserShareableLinks(
  userId: number,
  options?: {
    productId?: number;
    type?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ links: ShareableLink[]; total: number }> {
  // Build where clause
  const where: any = { userId };
  
  if (options?.productId !== undefined) {
    where.productId = options.productId;
  }
  
  if (options?.type !== undefined) {
    where.type = options.type;
  }
  
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }
  
  // Get total count
  const total = await prisma.shareableLink.count({ where });
  
  // Get links with pagination
  const links = await prisma.shareableLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          referralCommissionType: true,
          referralCommissionValue: true,
        },
      },
    },
  });
  
  return { links, total };
}

/**
 * Update a shareable link
 * 
 * @param id Link ID
 * @param data Update data
 * @returns Updated shareable link
 */
export async function updateShareableLink(
  id: number,
  data: {
    title?: string;
    description?: string;
    customImage?: string;
    isActive?: boolean;
    expiresAt?: Date | null;
  }
): Promise<ShareableLink> {
  return await prisma.shareableLink.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a shareable link
 * 
 * @param id Link ID
 * @returns Deleted shareable link
 */
export async function deleteShareableLink(id: number): Promise<ShareableLink> {
  return await prisma.shareableLink.delete({
    where: { id },
  });
}

/**
 * Record a click on a shareable link
 * 
 * @param linkId Link ID
 * @param data Click data
 * @returns Created link click
 */
export async function recordLinkClick(
  linkId: number,
  data?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
): Promise<LinkClick> {
  // Update click count
  await prisma.shareableLink.update({
    where: { id: linkId },
    data: {
      clickCount: {
        increment: 1,
      },
      updatedAt: new Date(),
    },
  });
  
  // Record click details
  return await prisma.linkClick.create({
    data: {
      linkId,
      ipAddress: data?.ipAddress,
      userAgent: data?.userAgent,
      referrer: data?.referrer,
      utmSource: data?.utmSource,
      utmMedium: data?.utmMedium,
      utmCampaign: data?.utmCampaign,
    },
  });
}

/**
 * Calculate referral commission for a purchase
 * 
 * @param productId Product ID
 * @param totalAmount Purchase total amount
 * @returns Commission amount and percentage
 */
export async function calculateReferralCommission(
  productId: number,
  totalAmount: number
): Promise<{ amount: number; percentage: number }> {
  // Get the product
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      referralCommissionType: true,
      referralCommissionValue: true,
    },
  });
  
  if (!product || !product.referralCommissionType || !product.referralCommissionValue) {
    // Default commission: 5%
    return {
      amount: totalAmount * 0.05,
      percentage: 5,
    };
  }
  
  if (product.referralCommissionType === "percentage") {
    return {
      amount: totalAmount * (product.referralCommissionValue / 100),
      percentage: product.referralCommissionValue,
    };
  } else {
    // Fixed amount
    return {
      amount: product.referralCommissionValue,
      percentage: (product.referralCommissionValue / totalAmount) * 100,
    };
  }
}

/**
 * Record a purchase from a shareable link
 * 
 * @param purchaseId Purchase ID
 * @param linkId Link ID
 * @returns Created referral commission
 */
export async function recordReferralPurchase(
  purchaseId: number,
  linkId: number
): Promise<ReferralCommission> {
  // Get the purchase
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      product: true,
      user: true,
      referralLink: {
        include: {
          user: true,
        },
      },
    },
  });
  
  if (!purchase) {
    throw new Error(`Purchase with ID ${purchaseId} not found`);
  }
  
  if (!purchase.referralLink) {
    throw new Error(`Purchase with ID ${purchaseId} has no referral link`);
  }
  
  // Calculate commission
  const { amount, percentage } = await calculateReferralCommission(
    purchase.productId,
    purchase.totalAmount
  );
  
  // Create the referral commission
  const commission = await prisma.referralCommission.create({
    data: {
      purchaseId,
      linkId,
      referrerId: purchase.referralLink.userId,
      buyerId: purchase.userId,
      productId: purchase.productId,
      amount,
      percentage,
      status: "pending",
    },
  });
  
  // Update link statistics
  await prisma.shareableLink.update({
    where: { id: linkId },
    data: {
      conversionCount: {
        increment: 1,
      },
      totalRevenue: {
        increment: purchase.totalAmount,
      },
      totalCommission: {
        increment: amount,
      },
      updatedAt: new Date(),
    },
  });
  
  return commission;
}

/**
 * Get referral commissions for a user
 * 
 * @param userId User ID
 * @param options Query options
 * @returns List of referral commissions
 */
export async function getUserReferralCommissions(
  userId: number,
  options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ commissions: ReferralCommission[]; total: number }> {
  // Build where clause
  const where: any = { referrerId: userId };
  
  if (options?.status !== undefined) {
    where.status = options.status;
  }
  
  // Get total count
  const total = await prisma.referralCommission.count({ where });
  
  // Get commissions with pagination
  const commissions = await prisma.referralCommission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
    include: {
      purchase: {
        select: {
          id: true,
          quantity: true,
          totalAmount: true,
          createdAt: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
        },
      },
      link: {
        select: {
          id: true,
          code: true,
          type: true,
        },
      },
    },
  });
  
  return { commissions, total };
}

/**
 * Get referral statistics for a user
 * 
 * @param userId User ID
 * @returns Referral statistics
 */
export async function getUserReferralStats(userId: number): Promise<{
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
}> {
  // Get link statistics
  const linkStats = await prisma.shareableLink.aggregate({
    where: { userId },
    _sum: {
      clickCount: true,
      conversionCount: true,
      totalRevenue: true,
      totalCommission: true,
    },
    _count: {
      id: true,
    },
  });
  
  // Calculate conversion rate
  const totalClicks = linkStats._sum.clickCount || 0;
  const totalConversions = linkStats._sum.conversionCount || 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  
  return {
    totalLinks: linkStats._count.id,
    totalClicks,
    totalConversions,
    totalRevenue: linkStats._sum.totalRevenue || 0,
    totalCommission: linkStats._sum.totalCommission || 0,
    conversionRate,
  };
}

/**
 * Update referral commission status
 * 
 * @param id Commission ID
 * @param status New status
 * @param paidAt Paid date (for "paid" status)
 * @returns Updated referral commission
 */
export async function updateReferralCommissionStatus(
  id: number,
  status: string,
  paidAt?: Date
): Promise<ReferralCommission> {
  return await prisma.referralCommission.update({
    where: { id },
    data: {
      status,
      paidAt: status === "paid" ? paidAt || new Date() : undefined,
      updatedAt: new Date(),
    },
  });
}
