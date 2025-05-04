import { prisma } from "./prisma";

/**
 * Interface for shipping method
 */
export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  requiresDetails: boolean;
  detailsSchema: string | null;
  baseFee: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all shipping methods
 * 
 * @param activeOnly Whether to return only active shipping methods
 * @returns List of shipping methods
 */
export async function getAllShippingMethods(activeOnly: boolean = true): Promise<ShippingMethod[]> {
  return await prisma.shippingMethod.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a shipping method by ID
 * 
 * @param id Shipping method ID
 * @returns Shipping method or null if not found
 */
export async function getShippingMethodById(id: number): Promise<ShippingMethod | null> {
  return await prisma.shippingMethod.findUnique({
    where: { id },
  });
}

/**
 * Get a shipping method by code
 * 
 * @param code Shipping method code
 * @returns Shipping method or null if not found
 */
export async function getShippingMethodByCode(code: string): Promise<ShippingMethod | null> {
  return await prisma.shippingMethod.findUnique({
    where: { code },
  });
}

/**
 * Validate shipping details against the method's schema
 * 
 * @param shippingMethodId Shipping method ID
 * @param details Shipping details to validate
 * @returns Validation result
 */
export async function validateShippingDetails(
  shippingMethodId: number,
  details: Record<string, any>
): Promise<{ isValid: boolean; errors?: string[] }> {
  try {
    // Get the shipping method
    const shippingMethod = await getShippingMethodById(shippingMethodId);
    
    if (!shippingMethod) {
      return { isValid: false, errors: ['Shipping method not found'] };
    }
    
    // If the method doesn't require details, it's valid
    if (!shippingMethod.requiresDetails) {
      return { isValid: true };
    }
    
    // If the method requires details but no schema is defined, assume it's valid
    if (!shippingMethod.detailsSchema) {
      return { isValid: true };
    }
    
    // Parse the schema
    const schema = JSON.parse(shippingMethod.detailsSchema);
    
    // Validate required fields
    const errors: string[] = [];
    
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!details[field]) {
          errors.push(`${field} is required`);
        }
      }
    }
    
    // Validate field types (basic validation)
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [field, prop] of Object.entries<any>(schema.properties)) {
        if (details[field] !== undefined) {
          // Check type
          if (prop.type === 'number' && typeof details[field] !== 'number') {
            errors.push(`${field} must be a number`);
          } else if (prop.type === 'string' && typeof details[field] !== 'string') {
            errors.push(`${field} must be a string`);
          } else if (prop.type === 'boolean' && typeof details[field] !== 'boolean') {
            errors.push(`${field} must be a boolean`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error validating shipping details:', error);
    return { isValid: false, errors: ['Error validating shipping details'] };
  }
}

/**
 * Calculate shipping fee based on shipping method and details
 * 
 * @param shippingMethodId Shipping method ID
 * @param details Shipping details
 * @param productId Product ID (optional)
 * @param quantity Quantity (optional)
 * @returns Calculated shipping fee
 */
export async function calculateShippingFee(
  shippingMethodId: number,
  details: Record<string, any>,
  productId?: number,
  quantity?: number
): Promise<number> {
  try {
    // Get the shipping method
    const shippingMethod = await getShippingMethodById(shippingMethodId);
    
    if (!shippingMethod) {
      throw new Error('Shipping method not found');
    }
    
    // For pickup, the fee is always 0
    if (shippingMethod.code === 'pickup') {
      return 0;
    }
    
    // For now, just return the base fee
    // In a real implementation, you might calculate based on distance, weight, etc.
    return shippingMethod.baseFee;
    
    // Example of a more complex calculation:
    // if (shippingMethod.code === 'lalamove') {
    //   // Calculate based on distance or other factors
    //   // This would typically involve calling an external API
    //   return shippingMethod.baseFee;
    // } else if (shippingMethod.code === 'jnt') {
    //   // J&T might have different rates based on location
    //   return shippingMethod.baseFee;
    // }
  } catch (error) {
    console.error('Error calculating shipping fee:', error);
    throw error;
  }
}
