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
  birthdate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  uplineId: z.string().optional(),
  profileImage: z.string().optional(),
  preferredPaymentMethod: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  gcashNumber: z.string().optional(),
  payMayaNumber: z.string().optional(),
  receiveUpdates: z.boolean().optional().default(false),
  agreeToTerms: z.boolean(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.agreeToTerms === true, {
  message: "You must agree to the terms and conditions",
  path: ['agreeToTerms'],
}).refine(data => {
  // If preferredPaymentMethod is bank, validate bank details
  if (data.preferredPaymentMethod === 'bank') {
    return !!data.bankName && !!data.bankAccountNumber && !!data.bankAccountName;
  }
  // If preferredPaymentMethod is gcash, validate gcash number
  if (data.preferredPaymentMethod === 'gcash') {
    return !!data.gcashNumber;
  }
  // If preferredPaymentMethod is paymaya, validate paymaya number
  if (data.preferredPaymentMethod === 'paymaya') {
    return !!data.payMayaNumber;
  }
  return true;
}, {
  message: "Payment details are required for the selected payment method",
  path: ['preferredPaymentMethod'],
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
  // Payment information
  paymentMethodId: z.number().int().positive('Payment method ID must be a positive integer').optional(),
  paymentDetails: z.record(z.any()).optional(),
  referenceNumber: z.string().optional(),
  // Shipping information
  shippingMethodId: z.number().int().positive('Shipping method ID must be a positive integer').optional(),
  shippingDetails: z.record(z.any()).optional(),
  shippingAddress: z.string().optional(),
  shippingFee: z.number().nonnegative('Shipping fee must be a non-negative number').optional(),
  // Referral information
  referralCode: z.string().optional(),
});

// Wallet transaction validation schema
export const walletTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['withdrawal', 'deposit'], {
    errorMap: () => ({ message: 'Invalid transaction type' }),
  }),
  description: z.string().optional(),
  paymentMethodId: z.number().int().positive('Payment method ID must be a positive integer').optional(),
  paymentDetails: z.record(z.any()).optional(),
  referenceNumber: z.string().optional(),
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
