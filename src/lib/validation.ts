import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  csrfToken: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  phone: z.string().optional(),
  uplineId: z.string().optional(),
  profileImage: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
  confirmNewPassword: z.string().optional(),
  profileImage: z.string().optional(),
}).refine(data => {
  // If newPassword is provided, confirmNewPassword must match
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "New passwords don't match",
  path: ['confirmNewPassword'],
}).refine(data => {
  // If newPassword is provided, currentPassword must also be provided
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to set a new password",
  path: ['currentPassword'],
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  image: z.string().optional(),
  rebateConfigs: z.array(
    z.object({
      level: z.number().int().positive('Level must be a positive integer'),
      percentage: z.number().positive('Percentage must be positive').max(100, 'Percentage cannot exceed 100%'),
    })
  ).min(1, 'At least one rebate configuration is required'),
});

// Purchase validation schema
export const purchaseSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

// Wallet transaction validation schema
export const walletTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['withdrawal'], {
    errorMap: () => ({ message: 'Invalid transaction type' }),
  }),
  description: z.string().optional(),
});

// Rank advancement validation schema
export const rankAdvancementSchema = z.object({
  checkAll: z.boolean().optional(),
});

/**
 * Validate data against a schema
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validation result
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      return { success: false, errors };
    }

    return {
      success: false,
      errors: { _error: 'An unexpected error occurred during validation' }
    };
  }
}
