import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

/**
 * Interface for product data
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  pv: number;
  binaryValue: number;
  inventory: number;
  tags: string | null;
  image: string | null;
  isActive: boolean;
  referralCommissionType: string | null;
  referralCommissionValue: number | null;
  lastUpdatedBy: number | null;
  lastUpdatedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for product creation
 */
export interface ProductCreateInput {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  pv: number;
  binaryValue?: number;
  inventory?: number;
  tags?: string | null;
  image?: string | null;
  isActive?: boolean;
  referralCommissionType?: string | null;
  referralCommissionValue?: number | null;
  userId: number;
  userName: string;
}

/**
 * Interface for product update
 */
export interface ProductUpdateInput {
  name?: string;
  sku?: string;
  description?: string | null;
  price?: number;
  pv?: number;
  binaryValue?: number;
  inventory?: number;
  tags?: string | null;
  image?: string | null;
  isActive?: boolean;
  referralCommissionType?: string | null;
  referralCommissionValue?: number | null;
  userId: number;
  userName: string;
}

/**
 * Interface for product filter
 */
export interface ProductFilter {
  search?: string;
  tags?: string[];
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minPv?: number;
  maxPv?: number;
  minInventory?: number;
  maxInventory?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Interface for product audit log
 */
export interface ProductAudit {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  action: string;
  details: string | null;
  createdAt: Date;
}

/**
 * Interface for product sales history
 */
export interface ProductSalesHistory {
  id: number;
  productId: number;
  year: number;
  month: number;
  quantity: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for bulk product upload result
 */
export interface BulkUploadResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: { row: number; sku: string; error: string }[];
  createdProducts: Product[];
}

/**
 * Get all products with filtering and pagination
 * 
 * @param filter Filter options
 * @returns Products and pagination info
 */
export async function getProducts(filter: ProductFilter = {}) {
  // Build where clause
  const where: Prisma.ProductWhereInput = {};
  
  // Search by name or SKU
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { sku: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  
  // Filter by tags
  if (filter.tags && filter.tags.length > 0) {
    const tagConditions = filter.tags.map(tag => ({
      tags: { contains: tag, mode: 'insensitive' },
    }));
    
    where.OR = [...(where.OR || []), ...tagConditions];
  }
  
  // Filter by active status
  if (filter.isActive !== undefined) {
    where.isActive = filter.isActive;
  }
  
  // Filter by price range
  if (filter.minPrice !== undefined) {
    where.price = { ...where.price, gte: filter.minPrice };
  }
  
  if (filter.maxPrice !== undefined) {
    where.price = { ...where.price, lte: filter.maxPrice };
  }
  
  // Filter by PV range
  if (filter.minPv !== undefined) {
    where.pv = { ...where.pv, gte: filter.minPv };
  }
  
  if (filter.maxPv !== undefined) {
    where.pv = { ...where.pv, lte: filter.maxPv };
  }
  
  // Filter by inventory range
  if (filter.minInventory !== undefined) {
    where.inventory = { ...where.inventory, gte: filter.minInventory };
  }
  
  if (filter.maxInventory !== undefined) {
    where.inventory = { ...where.inventory, lte: filter.maxInventory };
  }
  
  // Determine sort order
  const orderBy: any = {};
  
  if (filter.sortBy) {
    orderBy[filter.sortBy] = filter.sortOrder || 'asc';
  } else {
    orderBy.createdAt = 'desc';
  }
  
  // Pagination
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 10;
  const skip = (page - 1) * pageSize;
  
  // Get total count
  const totalCount = await prisma.product.count({ where });
  
  // Get products
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip,
    take: pageSize,
  });
  
  return {
    products,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasMore: skip + products.length < totalCount,
    },
  };
}

/**
 * Get a product by ID
 * 
 * @param id Product ID
 * @returns Product or null if not found
 */
export async function getProductById(id: number): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { id },
  });
}

/**
 * Get a product by SKU
 * 
 * @param sku Product SKU
 * @returns Product or null if not found
 */
export async function getProductBySku(sku: string): Promise<Product | null> {
  return await prisma.product.findUnique({
    where: { sku },
  });
}

/**
 * Create a new product
 * 
 * @param data Product data
 * @returns Created product
 */
export async function createProduct(data: ProductCreateInput): Promise<Product> {
  // Check if SKU already exists
  const existingProduct = await getProductBySku(data.sku);
  
  if (existingProduct) {
    throw new Error(`Product with SKU ${data.sku} already exists`);
  }
  
  // Create product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Create the product
    const product = await tx.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        pv: data.pv,
        binaryValue: data.binaryValue || 0,
        inventory: data.inventory || 0,
        tags: data.tags,
        image: data.image,
        isActive: data.isActive !== undefined ? data.isActive : true,
        referralCommissionType: data.referralCommissionType,
        referralCommissionValue: data.referralCommissionValue,
        lastUpdatedBy: data.userId,
        lastUpdatedByName: data.userName,
      },
    });
    
    // Create audit log
    await tx.productAudit.create({
      data: {
        productId: product.id,
        userId: data.userId,
        userName: data.userName,
        action: 'create',
        details: JSON.stringify({
          name: product.name,
          sku: product.sku,
          price: product.price,
          pv: product.pv,
        }),
      },
    });
    
    return product;
  });
}

/**
 * Update a product
 * 
 * @param id Product ID
 * @param data Product data
 * @returns Updated product
 */
export async function updateProduct(id: number, data: ProductUpdateInput): Promise<Product> {
  // Get the current product
  const currentProduct = await getProductById(id);
  
  if (!currentProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  // Check if SKU is being changed and if it already exists
  if (data.sku && data.sku !== currentProduct.sku) {
    const existingProduct = await getProductBySku(data.sku);
    
    if (existingProduct && existingProduct.id !== id) {
      throw new Error(`Product with SKU ${data.sku} already exists`);
    }
  }
  
  // Update product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Update the product
    const product = await tx.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        pv: data.pv,
        binaryValue: data.binaryValue,
        inventory: data.inventory,
        tags: data.tags,
        image: data.image,
        isActive: data.isActive,
        referralCommissionType: data.referralCommissionType,
        referralCommissionValue: data.referralCommissionValue,
        lastUpdatedBy: data.userId,
        lastUpdatedByName: data.userName,
        updatedAt: new Date(),
      },
    });
    
    // Create audit log with changes
    const changes: Record<string, { from: any; to: any }> = {};
    
    // Track changes
    if (data.name && data.name !== currentProduct.name) {
      changes.name = { from: currentProduct.name, to: data.name };
    }
    
    if (data.sku && data.sku !== currentProduct.sku) {
      changes.sku = { from: currentProduct.sku, to: data.sku };
    }
    
    if (data.price && data.price !== currentProduct.price) {
      changes.price = { from: currentProduct.price, to: data.price };
    }
    
    if (data.pv && data.pv !== currentProduct.pv) {
      changes.pv = { from: currentProduct.pv, to: data.pv };
    }
    
    if (data.binaryValue !== undefined && data.binaryValue !== currentProduct.binaryValue) {
      changes.binaryValue = { from: currentProduct.binaryValue, to: data.binaryValue };
    }
    
    if (data.inventory !== undefined && data.inventory !== currentProduct.inventory) {
      changes.inventory = { from: currentProduct.inventory, to: data.inventory };
    }
    
    if (data.isActive !== undefined && data.isActive !== currentProduct.isActive) {
      changes.isActive = { from: currentProduct.isActive, to: data.isActive };
    }
    
    await tx.productAudit.create({
      data: {
        productId: product.id,
        userId: data.userId,
        userName: data.userName,
        action: 'update',
        details: JSON.stringify(changes),
      },
    });
    
    return product;
  });
}

/**
 * Delete a product
 * 
 * @param id Product ID
 * @param userId User ID
 * @param userName User name
 * @returns Deleted product
 */
export async function deleteProduct(id: number, userId: number, userName: string): Promise<Product> {
  // Get the current product
  const currentProduct = await getProductById(id);
  
  if (!currentProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  // Check if product has any purchases
  const purchaseCount = await prisma.purchase.count({
    where: { productId: id },
  });
  
  if (purchaseCount > 0) {
    throw new Error(`Cannot delete product with ID ${id} because it has ${purchaseCount} purchases`);
  }
  
  // Delete product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Create audit log before deletion
    await tx.productAudit.create({
      data: {
        productId: id,
        userId,
        userName,
        action: 'delete',
        details: JSON.stringify({
          name: currentProduct.name,
          sku: currentProduct.sku,
        }),
      },
    });
    
    // Delete the product
    return await tx.product.delete({
      where: { id },
    });
  });
}

/**
 * Toggle product active status
 * 
 * @param id Product ID
 * @param isActive New active status
 * @param userId User ID
 * @param userName User name
 * @returns Updated product
 */
export async function toggleProductStatus(
  id: number,
  isActive: boolean,
  userId: number,
  userName: string
): Promise<Product> {
  // Get the current product
  const currentProduct = await getProductById(id);
  
  if (!currentProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  // Update product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Update the product
    const product = await tx.product.update({
      where: { id },
      data: {
        isActive,
        lastUpdatedBy: userId,
        lastUpdatedByName: userName,
        updatedAt: new Date(),
      },
    });
    
    // Create audit log
    await tx.productAudit.create({
      data: {
        productId: product.id,
        userId,
        userName,
        action: isActive ? 'activate' : 'deactivate',
        details: JSON.stringify({
          name: product.name,
          sku: product.sku,
          isActive: { from: currentProduct.isActive, to: isActive },
        }),
      },
    });
    
    return product;
  });
}

/**
 * Clone a product
 * 
 * @param id Product ID to clone
 * @param newSku New SKU for the cloned product
 * @param userId User ID
 * @param userName User name
 * @returns Cloned product
 */
export async function cloneProduct(
  id: number,
  newSku: string,
  userId: number,
  userName: string
): Promise<Product> {
  // Get the source product
  const sourceProduct = await getProductById(id);
  
  if (!sourceProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  // Check if new SKU already exists
  const existingProduct = await getProductBySku(newSku);
  
  if (existingProduct) {
    throw new Error(`Product with SKU ${newSku} already exists`);
  }
  
  // Clone product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Create the cloned product
    const clonedProduct = await tx.product.create({
      data: {
        name: `${sourceProduct.name} (Copy)`,
        sku: newSku,
        description: sourceProduct.description,
        price: sourceProduct.price,
        pv: sourceProduct.pv,
        binaryValue: sourceProduct.binaryValue,
        inventory: 0, // Start with zero inventory
        tags: sourceProduct.tags,
        image: sourceProduct.image,
        isActive: false, // Start as inactive
        referralCommissionType: sourceProduct.referralCommissionType,
        referralCommissionValue: sourceProduct.referralCommissionValue,
        lastUpdatedBy: userId,
        lastUpdatedByName: userName,
      },
    });
    
    // Create audit log
    await tx.productAudit.create({
      data: {
        productId: clonedProduct.id,
        userId,
        userName,
        action: 'clone',
        details: JSON.stringify({
          sourceProductId: sourceProduct.id,
          sourceProductSku: sourceProduct.sku,
          newSku: clonedProduct.sku,
        }),
      },
    });
    
    return clonedProduct;
  });
}

/**
 * Update product inventory
 * 
 * @param id Product ID
 * @param quantity New inventory quantity
 * @param userId User ID
 * @param userName User name
 * @returns Updated product
 */
export async function updateProductInventory(
  id: number,
  quantity: number,
  userId: number,
  userName: string
): Promise<Product> {
  // Get the current product
  const currentProduct = await getProductById(id);
  
  if (!currentProduct) {
    throw new Error(`Product with ID ${id} not found`);
  }
  
  // Update product in a transaction
  return await prisma.$transaction(async (tx) => {
    // Update the product
    const product = await tx.product.update({
      where: { id },
      data: {
        inventory: quantity,
        lastUpdatedBy: userId,
        lastUpdatedByName: userName,
        updatedAt: new Date(),
      },
    });
    
    // Create audit log
    await tx.productAudit.create({
      data: {
        productId: product.id,
        userId,
        userName,
        action: 'update_inventory',
        details: JSON.stringify({
          name: product.name,
          sku: product.sku,
          inventory: { from: currentProduct.inventory, to: quantity },
        }),
      },
    });
    
    return product;
  });
}

/**
 * Get product audit logs
 * 
 * @param productId Product ID
 * @param limit Maximum number of logs to return
 * @param offset Offset for pagination
 * @returns Audit logs
 */
export async function getProductAuditLogs(
  productId: number,
  limit: number = 10,
  offset: number = 0
): Promise<{ logs: ProductAudit[]; total: number }> {
  // Get total count
  const total = await prisma.productAudit.count({
    where: { productId },
  });
  
  // Get logs
  const logs = await prisma.productAudit.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  return { logs, total };
}

/**
 * Get product sales history
 * 
 * @param productId Product ID
 * @param months Number of months to retrieve
 * @returns Sales history
 */
export async function getProductSalesHistory(
  productId: number,
  months: number = 12
): Promise<ProductSalesHistory[]> {
  // Calculate start date
  const now = new Date();
  const startYear = now.getFullYear();
  const startMonth = now.getMonth() + 1 - months;
  
  let year = startYear;
  let month = startMonth;
  
  if (month <= 0) {
    year -= Math.floor(Math.abs(month) / 12) + 1;
    month = 12 - (Math.abs(month) % 12);
  }
  
  // Get sales history
  const history = await prisma.productSalesHistory.findMany({
    where: {
      productId,
      OR: [
        {
          year: { gt: year },
        },
        {
          year,
          month: { gte: month },
        },
      ],
    },
    orderBy: [
      { year: 'asc' },
      { month: 'asc' },
    ],
  });
  
  return history;
}

/**
 * Update product sales history
 * 
 * @param productId Product ID
 * @param year Year
 * @param month Month
 * @param quantity Quantity sold
 * @param revenue Revenue generated
 * @returns Updated sales history
 */
export async function updateProductSalesHistory(
  productId: number,
  year: number,
  month: number,
  quantity: number,
  revenue: number
): Promise<ProductSalesHistory> {
  return await prisma.productSalesHistory.upsert({
    where: {
      productId_year_month: {
        productId,
        year,
        month,
      },
    },
    update: {
      quantity: { increment: quantity },
      revenue: { increment: revenue },
      updatedAt: new Date(),
    },
    create: {
      productId,
      year,
      month,
      quantity,
      revenue,
      updatedAt: new Date(),
    },
  });
}

/**
 * Bulk upload products
 * 
 * @param products Array of product data
 * @param userId User ID
 * @param userName User name
 * @returns Bulk upload result
 */
export async function bulkUploadProducts(
  products: ProductCreateInput[],
  userId: number,
  userName: string
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    totalProcessed: products.length,
    successful: 0,
    failed: 0,
    errors: [],
    createdProducts: [],
  };
  
  // Process each product
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      // Set user info
      product.userId = userId;
      product.userName = userName;
      
      // Create the product
      const createdProduct = await createProduct(product);
      
      result.successful++;
      result.createdProducts.push(createdProduct);
    } catch (error) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        sku: product.sku,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return result;
}

/**
 * Bulk update products
 * 
 * @param updates Array of product updates
 * @param userId User ID
 * @param userName User name
 * @returns Number of updated products
 */
export async function bulkUpdateProducts(
  updates: { id: number; data: Omit<ProductUpdateInput, 'userId' | 'userName'> }[],
  userId: number,
  userName: string
): Promise<number> {
  let updatedCount = 0;
  
  // Process each update
  for (const update of updates) {
    try {
      // Set user info
      const data = {
        ...update.data,
        userId,
        userName,
      };
      
      // Update the product
      await updateProduct(update.id, data);
      
      updatedCount++;
    } catch (error) {
      console.error(`Error updating product ${update.id}:`, error);
    }
  }
  
  return updatedCount;
}

/**
 * Calculate rebate for a product
 * 
 * @param productId Product ID
 * @param quantity Quantity
 * @param level Level in the MLM structure
 * @returns Rebate amount
 */
export async function calculateProductRebate(
  productId: number,
  quantity: number,
  level: number
): Promise<number> {
  // Get the product
  const product = await getProductById(productId);
  
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  
  // Get rebate configuration for the product and level
  const rebateConfig = await prisma.rebateConfig.findFirst({
    where: {
      productId,
      level,
    },
  });
  
  if (!rebateConfig) {
    // Default rebate calculation based on level
    const defaultPercentage = level === 1 ? 0.1 : // 10% for level 1
                             level === 2 ? 0.075 : // 7.5% for level 2
                             level <= 6 ? 0.05 : // 5% for levels 3-6
                             0; // 0% for levels > 6
    
    return product.pv * quantity * defaultPercentage;
  }
  
  // Calculate rebate based on configuration
  if (rebateConfig.type === 'percentage') {
    return product.pv * quantity * (rebateConfig.percentage / 100);
  } else {
    return rebateConfig.fixedAmount * quantity;
  }
}

/**
 * Simulate rebates for a product at all levels
 * 
 * @param productId Product ID
 * @param quantity Quantity
 * @param maxLevel Maximum level to simulate
 * @returns Rebate simulation results
 */
export async function simulateProductRebates(
  productId: number,
  quantity: number,
  maxLevel: number = 6
): Promise<{ level: number; rebate: number }[]> {
  const results = [];
  
  // Simulate rebate for each level
  for (let level = 1; level <= maxLevel; level++) {
    const rebate = await calculateProductRebate(productId, quantity, level);
    results.push({ level, rebate });
  }
  
  return results;
}

/**
 * Get all unique product tags
 * 
 * @returns Array of unique tags
 */
export async function getAllProductTags(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: {
      tags: {
        not: null,
      },
    },
    select: {
      tags: true,
    },
  });
  
  // Extract and flatten all tags
  const allTags = products
    .map(product => product.tags?.split(',').map(tag => tag.trim()) || [])
    .flat();
  
  // Remove duplicates
  return [...new Set(allTags)].filter(tag => tag !== '');
}
