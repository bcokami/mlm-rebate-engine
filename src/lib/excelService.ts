import * as XLSX from 'xlsx';
import { ProductCreateInput } from './productService';

/**
 * Interface for Excel row validation result
 */
interface RowValidationResult {
  isValid: boolean;
  errors: string[];
  data?: ProductCreateInput;
}

/**
 * Parse Excel file for product import
 * 
 * @param buffer Excel file buffer
 * @returns Array of product data
 */
export function parseProductExcel(buffer: Buffer): ProductCreateInput[] {
  // Read the Excel file
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  // Validate and convert rows
  const products: ProductCreateInput[] = [];
  
  for (const row of rows) {
    const validationResult = validateProductRow(row);
    
    if (validationResult.isValid && validationResult.data) {
      products.push(validationResult.data);
    } else {
      console.error('Invalid row:', row, 'Errors:', validationResult.errors);
      // You might want to collect errors and return them to the user
    }
  }
  
  return products;
}

/**
 * Validate a row from the Excel file
 * 
 * @param row Row data
 * @returns Validation result
 */
function validateProductRow(row: any): RowValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!row.name) {
    errors.push('Name is required');
  }
  
  if (!row.sku) {
    errors.push('SKU is required');
  }
  
  if (row.price === undefined || isNaN(Number(row.price)) || Number(row.price) <= 0) {
    errors.push('Price must be a positive number');
  }
  
  if (row.pv === undefined || isNaN(Number(row.pv)) || Number(row.pv) < 0) {
    errors.push('PV must be a non-negative number');
  }
  
  // If there are errors, return them
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Convert row to product data
  const product: ProductCreateInput = {
    name: String(row.name),
    sku: String(row.sku),
    description: row.description ? String(row.description) : null,
    price: Number(row.price),
    pv: Number(row.pv),
    binaryValue: row.binaryValue !== undefined ? Number(row.binaryValue) : 0,
    inventory: row.inventory !== undefined ? Number(row.inventory) : 0,
    tags: row.tags ? String(row.tags) : null,
    image: row.image ? String(row.image) : null,
    isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
    referralCommissionType: row.referralCommissionType ? String(row.referralCommissionType) : null,
    referralCommissionValue: row.referralCommissionValue !== undefined ? Number(row.referralCommissionValue) : null,
    userId: 0, // Will be set by the service
    userName: '', // Will be set by the service
  };
  
  return { isValid: true, errors: [], data: product };
}

/**
 * Generate Excel template for product import
 * 
 * @returns Excel file buffer
 */
export function generateProductTemplate(): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Sample data
  const data = [
    {
      name: 'Sample Product',
      sku: 'PROD-001',
      description: 'This is a sample product',
      price: 100,
      pv: 50,
      binaryValue: 25,
      inventory: 100,
      tags: 'sample,product,template',
      image: 'https://example.com/image.jpg',
      isActive: true,
      referralCommissionType: 'percentage',
      referralCommissionValue: 10,
    },
  ];
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add column headers
  XLSX.utils.sheet_add_aoa(worksheet, [
    [
      'name*', 'sku*', 'description', 'price*', 'pv*', 'binaryValue',
      'inventory', 'tags', 'image', 'isActive', 'referralCommissionType', 'referralCommissionValue',
    ],
  ], { origin: 'A1' });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Export products to Excel
 * 
 * @param products Array of products
 * @returns Excel file buffer
 */
export function exportProductsToExcel(products: any[]): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for export
  const data = products.map(product => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price,
    pv: product.pv,
    binaryValue: product.binaryValue,
    inventory: product.inventory,
    tags: product.tags,
    image: product.image,
    isActive: product.isActive,
    referralCommissionType: product.referralCommissionType,
    referralCommissionValue: product.referralCommissionValue,
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
    updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : null,
  }));
  
  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}
