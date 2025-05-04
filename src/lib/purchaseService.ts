import { prisma } from "./prisma";
import { calculatePvRebates } from "./pvRebateCalculator";
import { calculatePv } from "./mlmConfigService";
import { validatePaymentDetails } from "./paymentMethodService";
import { validateShippingDetails, calculateShippingFee } from "./shippingMethodService";

/**
 * Interface for purchase creation
 */
export interface PurchaseCreateInput {
  userId: number;
  productId: number;
  quantity: number;
  paymentMethodId?: number;
  paymentDetails?: any;
  referenceNumber?: string;
  // Shipping information
  shippingMethodId?: number;
  shippingDetails?: any;
  shippingAddress?: string;
  shippingFee?: number;
  // Referral information
  referralLinkId?: number | null;
  referralSource?: string | null;
  referralData?: string | null;
}

/**
 * Create a new purchase
 *
 * @param data Purchase data
 * @returns Created purchase with rebate calculation result
 */
export async function createPurchase(data: PurchaseCreateInput) {
  try {
    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error(`Product with ID ${data.productId} not found`);
    }

    // Calculate total amount
    const totalAmount = product.price * data.quantity;

    // Calculate PV based on configuration
    const totalPV = await calculatePv(totalAmount, product.pv * data.quantity);

    // Validate payment details if a payment method is provided
    if (data.paymentMethodId) {
      // Validate payment details
      const validationResult = await validatePaymentDetails(
        data.paymentMethodId,
        data.paymentDetails || {}
      );

      if (!validationResult.isValid) {
        throw new Error(`Invalid payment details: ${validationResult.errors?.join(', ')}`);
      }
    }

    // Validate shipping details if a shipping method is provided
    if (data.shippingMethodId) {
      // Validate shipping details
      const validationResult = await validateShippingDetails(
        data.shippingMethodId,
        data.shippingDetails || {}
      );

      if (!validationResult.isValid) {
        throw new Error(`Invalid shipping details: ${validationResult.errors?.join(', ')}`);
      }

      // Calculate shipping fee if not provided
      if (data.shippingFee === undefined) {
        data.shippingFee = await calculateShippingFee(
          data.shippingMethodId,
          data.shippingDetails || {},
          data.productId,
          data.quantity
        );
      }
    }

    // Create purchase in a transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create the purchase
      const newPurchase = await tx.purchase.create({
        data: {
          userId: data.userId,
          productId: data.productId,
          quantity: data.quantity,
          totalAmount,
          totalPV,
          // Payment information
          paymentMethodId: data.paymentMethodId,
          paymentDetails: data.paymentDetails ? JSON.stringify(data.paymentDetails) : null,
          referenceNumber: data.referenceNumber,
          // Shipping information
          shippingMethodId: data.shippingMethodId,
          shippingDetails: data.shippingDetails ? JSON.stringify(data.shippingDetails) : null,
          shippingAddress: data.shippingAddress,
          shippingFee: data.shippingFee,
          shippingStatus: data.shippingMethodId ? "pending" : null,
          // Referral information
          referralLinkId: data.referralLinkId,
          referralSource: data.referralSource,
          referralData: data.referralData,
        },
      });

      return newPurchase;
    });

    // Calculate and create rebates based on PV
    const rebateResult = await calculatePvRebates(
      purchase.id,
      data.userId,
      data.productId,
      totalAmount,
      totalPV
    );

    return {
      purchase,
      rebateResult,
    };
  } catch (error) {
    console.error("Error creating purchase:", error);
    throw error;
  }
}

/**
 * Get purchases for a user
 *
 * @param userId User ID
 * @param limit Maximum number of purchases to return
 * @param offset Offset for pagination
 * @returns List of purchases
 */
export async function getUserPurchases(
  userId: number,
  limit: number = 10,
  offset: number = 0
) {
  try {
    // Get purchases
    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        product: true,
        paymentMethod: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.purchase.count({
      where: { userId },
    });

    return {
      purchases,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + purchases.length < totalCount,
      },
    };
  } catch (error) {
    console.error("Error getting user purchases:", error);
    throw error;
  }
}

/**
 * Get a purchase by ID
 *
 * @param id Purchase ID
 * @returns Purchase or null if not found
 */
export async function getPurchaseById(id: number) {
  try {
    return await prisma.purchase.findUnique({
      where: { id },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentMethod: true,
        rebates: {
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error getting purchase by ID:", error);
    throw error;
  }
}

/**
 * Update a purchase status
 *
 * @param id Purchase ID
 * @param status New status
 * @returns Updated purchase
 */
export async function updatePurchaseStatus(id: number, status: string) {
  try {
    return await prisma.purchase.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error updating purchase status:", error);
    throw error;
  }
}

/**
 * Get purchase statistics for a user
 *
 * @param userId User ID
 * @returns Purchase statistics
 */
export async function getUserPurchaseStats(userId: number) {
  try {
    // Get total purchases
    const totalPurchases = await prisma.purchase.count({
      where: { userId },
    });

    // Get total amount spent
    const totalAmountResult = await prisma.purchase.aggregate({
      where: { userId },
      _sum: {
        totalAmount: true,
        totalPV: true,
      },
    });

    // Get recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return {
      totalPurchases,
      totalAmount: totalAmountResult._sum.totalAmount || 0,
      totalPV: totalAmountResult._sum.totalPV || 0,
      recentPurchases,
    };
  } catch (error) {
    console.error("Error getting user purchase stats:", error);
    throw error;
  }
}
