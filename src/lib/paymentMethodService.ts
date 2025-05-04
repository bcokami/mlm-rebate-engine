import { prisma } from "./prisma";

/**
 * Interface for payment method
 */
export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  requiresDetails: boolean;
  detailsSchema: string | null;
}

/**
 * Interface for user payment method
 */
export interface UserPaymentMethod {
  id: number;
  userId: number;
  paymentMethodId: number;
  details: string;
  isDefault: boolean;
  paymentMethod?: PaymentMethod;
}

/**
 * Get all payment methods
 * 
 * @param activeOnly Whether to return only active payment methods
 * @returns List of payment methods
 */
export async function getAllPaymentMethods(activeOnly: boolean = true): Promise<PaymentMethod[]> {
  return await prisma.paymentMethod.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get a payment method by ID
 * 
 * @param id Payment method ID
 * @returns Payment method or null if not found
 */
export async function getPaymentMethodById(id: number): Promise<PaymentMethod | null> {
  return await prisma.paymentMethod.findUnique({
    where: { id },
  });
}

/**
 * Get a payment method by code
 * 
 * @param code Payment method code
 * @returns Payment method or null if not found
 */
export async function getPaymentMethodByCode(code: string): Promise<PaymentMethod | null> {
  return await prisma.paymentMethod.findUnique({
    where: { code },
  });
}

/**
 * Create a new payment method
 * 
 * @param data Payment method data
 * @returns Created payment method
 */
export async function createPaymentMethod(data: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
  return await prisma.paymentMethod.create({
    data,
  });
}

/**
 * Update a payment method
 * 
 * @param id Payment method ID
 * @param data Payment method data
 * @returns Updated payment method
 */
export async function updatePaymentMethod(
  id: number,
  data: Partial<Omit<PaymentMethod, 'id'>>
): Promise<PaymentMethod> {
  return await prisma.paymentMethod.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get user payment methods
 * 
 * @param userId User ID
 * @returns List of user payment methods
 */
export async function getUserPaymentMethods(userId: number): Promise<UserPaymentMethod[]> {
  return await prisma.userPaymentMethod.findMany({
    where: { userId },
    include: {
      paymentMethod: true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Get a user payment method by ID
 * 
 * @param id User payment method ID
 * @returns User payment method or null if not found
 */
export async function getUserPaymentMethodById(id: number): Promise<UserPaymentMethod | null> {
  return await prisma.userPaymentMethod.findUnique({
    where: { id },
    include: {
      paymentMethod: true,
    },
  });
}

/**
 * Add a payment method for a user
 * 
 * @param userId User ID
 * @param paymentMethodId Payment method ID
 * @param details Payment details (JSON string)
 * @param isDefault Whether this is the default payment method
 * @returns Created user payment method
 */
export async function addUserPaymentMethod(
  userId: number,
  paymentMethodId: number,
  details: string,
  isDefault: boolean = false
): Promise<UserPaymentMethod> {
  // If this is the default payment method, unset any existing default
  if (isDefault) {
    await prisma.userPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return await prisma.userPaymentMethod.create({
    data: {
      userId,
      paymentMethodId,
      details,
      isDefault,
    },
    include: {
      paymentMethod: true,
    },
  });
}

/**
 * Update a user payment method
 * 
 * @param id User payment method ID
 * @param details Payment details (JSON string)
 * @param isDefault Whether this is the default payment method
 * @returns Updated user payment method
 */
export async function updateUserPaymentMethod(
  id: number,
  details?: string,
  isDefault?: boolean
): Promise<UserPaymentMethod> {
  const userPaymentMethod = await prisma.userPaymentMethod.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!userPaymentMethod) {
    throw new Error(`User payment method with ID ${id} not found`);
  }

  // If this is being set as the default payment method, unset any existing default
  if (isDefault) {
    await prisma.userPaymentMethod.updateMany({
      where: { 
        userId: userPaymentMethod.userId, 
        isDefault: true,
        id: { not: id },
      },
      data: { isDefault: false },
    });
  }

  return await prisma.userPaymentMethod.update({
    where: { id },
    data: {
      details: details !== undefined ? details : undefined,
      isDefault: isDefault !== undefined ? isDefault : undefined,
      updatedAt: new Date(),
    },
    include: {
      paymentMethod: true,
    },
  });
}

/**
 * Delete a user payment method
 * 
 * @param id User payment method ID
 * @returns Deleted user payment method
 */
export async function deleteUserPaymentMethod(id: number): Promise<UserPaymentMethod> {
  return await prisma.userPaymentMethod.delete({
    where: { id },
    include: {
      paymentMethod: true,
    },
  });
}

/**
 * Set a user payment method as default
 * 
 * @param id User payment method ID
 * @returns Updated user payment method
 */
export async function setDefaultUserPaymentMethod(id: number): Promise<UserPaymentMethod> {
  const userPaymentMethod = await prisma.userPaymentMethod.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!userPaymentMethod) {
    throw new Error(`User payment method with ID ${id} not found`);
  }

  // Unset any existing default
  await prisma.userPaymentMethod.updateMany({
    where: { 
      userId: userPaymentMethod.userId, 
      isDefault: true,
      id: { not: id },
    },
    data: { isDefault: false },
  });

  // Set this one as default
  return await prisma.userPaymentMethod.update({
    where: { id },
    data: {
      isDefault: true,
      updatedAt: new Date(),
    },
    include: {
      paymentMethod: true,
    },
  });
}

/**
 * Validate payment details against the payment method's schema
 * 
 * @param paymentMethodId Payment method ID
 * @param details Payment details (object)
 * @returns Validation result
 */
export async function validatePaymentDetails(
  paymentMethodId: number,
  details: any
): Promise<{ isValid: boolean; errors?: string[] }> {
  const paymentMethod = await getPaymentMethodById(paymentMethodId);

  if (!paymentMethod) {
    return { isValid: false, errors: ['Payment method not found'] };
  }

  if (!paymentMethod.requiresDetails) {
    return { isValid: true };
  }

  if (!paymentMethod.detailsSchema) {
    return { isValid: true };
  }

  try {
    const schema = JSON.parse(paymentMethod.detailsSchema);
    
    // Simple validation based on required fields
    if (schema.required && Array.isArray(schema.required)) {
      const errors: string[] = [];
      
      for (const field of schema.required) {
        if (!details[field]) {
          errors.push(`Field "${field}" is required`);
        }
      }
      
      if (errors.length > 0) {
        return { isValid: false, errors };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating payment details:', error);
    return { isValid: false, errors: ['Invalid schema format'] };
  }
}
