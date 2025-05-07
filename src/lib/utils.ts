/**
 * Generate a unique order number
 * Format: ELH-YYYYMMDD-XXXXX (where XXXXX is a random 5-digit number)
 */
export function generateOrderNumber(): string {
  const prefix = 'ELH';
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  
  return `${prefix}-${dateStr}-${random}`;
}

/**
 * Format a currency amount
 * @param amount The amount to format
 * @param currency The currency code (default: PHP)
 */
export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PH', options).format(dateObj);
}

/**
 * Calculate the estimated delivery date based on the current date and delivery days
 * @param deliveryDays Number of days for delivery
 */
export function calculateEstimatedDelivery(deliveryDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + deliveryDays);
  return date;
}

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param str The string to truncate
 * @param length The maximum length
 */
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Get the status color for an order status
 * @param status The order status
 */
export function getOrderStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get the status color for a payment status
 * @param status The payment status
 */
export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get a human-readable payment method name
 * @param method The payment method code
 */
export function getPaymentMethodName(method: string): string {
  switch (method.toLowerCase()) {
    case 'credit_card':
      return 'Credit/Debit Card';
    case 'gcash':
      return 'GCash';
    case 'maya':
      return 'Maya';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'wallet':
      return 'Wallet Balance';
    case 'cod':
      return 'Cash on Delivery';
    default:
      return method;
  }
}
