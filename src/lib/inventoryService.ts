import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/**
 * Interface for inventory transaction
 */
export interface InventoryTransaction {
  id: number;
  productId: number;
  quantity: number;
  type: string;
  reference: string | null;
  referenceId: number | null;
  notes: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: Date;
}

/**
 * Interface for inventory transaction input
 */
export interface InventoryTransactionInput {
  productId: number;
  quantity: number;
  type: "purchase" | "adjustment" | "return" | "restock";
  reference?: string | null;
  referenceId?: number | null;
  notes?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
}

/**
 * Interface for inventory summary
 */
export interface InventorySummary {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  lastRestocked: Date | null;
  lastPurchased: Date | null;
}

/**
 * Interface for inventory notification
 */
export interface InventoryNotification {
  id: number;
  productId: number;
  productName: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Record an inventory transaction
 * 
 * @param data Transaction data
 * @returns The created transaction
 */
export async function recordInventoryTransaction(
  data: InventoryTransactionInput
): Promise<InventoryTransaction> {
  return await prisma.$transaction(async (tx) => {
    // Get the current product
    const product = await tx.product.findUnique({
      where: { id: data.productId },
      select: { id: name: true, inventory: true, lowStockThreshold: true },
    });
    
    if (!product) {
      throw new Error(`Product with ID ${data.productId} not found`);
    }
    
    // Calculate new inventory level
    let newInventory = product.inventory;
    
    if (data.type === "purchase" || data.type === "adjustment" && data.quantity < 0) {
      // Decrease inventory
      newInventory = Math.max(0, product.inventory - Math.abs(data.quantity));
    } else if (data.type === "restock" || data.type === "return" || (data.type === "adjustment" && data.quantity > 0)) {
      // Increase inventory
      newInventory = product.inventory + Math.abs(data.quantity);
    }
    
    // Update product inventory
    await tx.product.update({
      where: { id: data.productId },
      data: { inventory: newInventory },
    });
    
    // Create inventory transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        type: data.type,
        reference: data.reference || null,
        referenceId: data.referenceId || null,
        notes: data.notes || null,
        createdBy: data.createdBy || null,
        createdByName: data.createdByName || null,
      },
    });
    
    // Check if inventory is below threshold and create notification if needed
    if (
      product.lowStockThreshold !== null &&
      newInventory <= product.lowStockThreshold &&
      product.inventory > product.lowStockThreshold
    ) {
      // Create low stock notification
      await tx.notification.create({
        data: {
          type: "low_stock",
          title: "Low Stock Alert",
          message: `${product.name} is running low on stock (${newInventory} remaining)`,
          productId: product.id,
          isRead: false,
        },
      });
    }
    
    return transaction;
  });
}

/**
 * Get inventory transactions for a product
 * 
 * @param productId Product ID
 * @param limit Number of transactions to return
 * @param offset Offset for pagination
 * @returns Inventory transactions
 */
export async function getInventoryTransactions(
  productId: number,
  limit: number = 10,
  offset: number = 0
): Promise<{ transactions: InventoryTransaction[]; total: number }> {
  const total = await prisma.inventoryTransaction.count({
    where: { productId },
  });
  
  const transactions = await prisma.inventoryTransaction.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  
  return { transactions, total };
}

/**
 * Get inventory summary for all products
 * 
 * @param filter Filter options
 * @returns Inventory summary
 */
export async function getInventorySummary(filter: {
  search?: string;
  lowStockOnly?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<{ summary: InventorySummary[]; total: number }> {
  const where: Prisma.ProductWhereInput = {};
  
  // Search filter
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { sku: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  
  // Low stock filter
  if (filter.lowStockOnly) {
    where.AND = [
      { lowStockThreshold: { not: null } },
      {
        OR: [
          { inventory: { lte: { lowStockThreshold: true } } },
          { inventory: { equals: 0 } },
        ],
      },
    ];
  }
  
  // Get total count
  const total = await prisma.product.count({ where });
  
  // Determine sort order
  const orderBy: any = {};
  if (filter.sortBy) {
    orderBy[filter.sortBy] = filter.sortOrder || "asc";
  } else {
    orderBy.inventory = "asc"; // Default sort by inventory ascending
  }
  
  // Pagination
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const skip = (page - 1) * pageSize;
  
  // Get products with inventory info
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      inventory: true,
      lowStockThreshold: true,
      inventoryTransactions: {
        where: { type: "restock" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      purchases: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy,
    skip,
    take: pageSize,
  });
  
  // Transform to summary format
  const summary = products.map((product) => ({
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    currentStock: product.inventory,
    lowStockThreshold: product.lowStockThreshold,
    isLowStock:
      product.lowStockThreshold !== null &&
      product.inventory <= product.lowStockThreshold,
    lastRestocked:
      product.inventoryTransactions.length > 0
        ? product.inventoryTransactions[0].createdAt
        : null,
    lastPurchased:
      product.purchases.length > 0 ? product.purchases[0].createdAt : null,
  }));
  
  return { summary, total };
}

/**
 * Get low stock notifications
 * 
 * @param limit Number of notifications to return
 * @param offset Offset for pagination
 * @param includeRead Whether to include read notifications
 * @returns Inventory notifications
 */
export async function getLowStockNotifications(
  limit: number = 10,
  offset: number = 0,
  includeRead: boolean = false
): Promise<{ notifications: InventoryNotification[]; total: number }> {
  const where: Prisma.NotificationWhereInput = {
    type: "low_stock",
  };
  
  if (!includeRead) {
    where.isRead = false;
  }
  
  const total = await prisma.notification.count({ where });
  
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
  });
  
  // Transform to notification format
  const formattedNotifications = notifications.map((notification) => ({
    id: notification.id,
    productId: notification.productId!,
    productName: notification.product?.name || "Unknown Product",
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  }));
  
  return { notifications: formattedNotifications, total };
}

/**
 * Mark notification as read
 * 
 * @param id Notification ID
 * @returns Updated notification
 */
export async function markNotificationAsRead(
  id: number
): Promise<InventoryNotification> {
  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
  });
  
  return {
    id: notification.id,
    productId: notification.productId!,
    productName: notification.product?.name || "Unknown Product",
    type: notification.type,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

/**
 * Update product low stock threshold
 * 
 * @param productId Product ID
 * @param threshold Low stock threshold
 * @returns Updated product
 */
export async function updateLowStockThreshold(
  productId: number,
  threshold: number | null
): Promise<{ id: number; lowStockThreshold: number | null }> {
  const product = await prisma.product.update({
    where: { id: productId },
    data: { lowStockThreshold: threshold },
    select: { id: true, lowStockThreshold: true },
  });
  
  return product;
}
