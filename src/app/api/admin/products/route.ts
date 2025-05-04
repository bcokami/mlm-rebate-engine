import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductStatus,
  cloneProduct,
  bulkUploadProducts,
  bulkUpdateProducts,
  getAllProductTags
} from "@/lib/productService";
import { parseProductExcel, exportProductsToExcel, generateProductTemplate } from "@/lib/excelService";
import { z } from "zod";

// Schema for product creation
const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().nullable().optional(),
  price: z.number().positive("Price must be positive"),
  pv: z.number().min(0, "PV must be non-negative"),
  binaryValue: z.number().min(0, "Binary Value must be non-negative").optional(),
  inventory: z.number().min(0, "Inventory must be non-negative").optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  referralCommissionType: z.enum(["percentage", "fixed"]).nullable().optional(),
  referralCommissionValue: z.number().min(0).nullable().optional(),
});

// Schema for product update
const productUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive("Price must be positive").optional(),
  pv: z.number().min(0, "PV must be non-negative").optional(),
  binaryValue: z.number().min(0, "Binary Value must be non-negative").optional(),
  inventory: z.number().min(0, "Inventory must be non-negative").optional(),
  tags: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  referralCommissionType: z.enum(["percentage", "fixed"]).nullable().optional(),
  referralCommissionValue: z.number().min(0).nullable().optional(),
});

// Schema for bulk update
const bulkUpdateSchema = z.object({
  updates: z.array(productUpdateSchema),
});

// Schema for product clone
const productCloneSchema = z.object({
  id: z.number().int().positive(),
  newSku: z.string().min(1, "New SKU is required"),
});

// Schema for product status toggle
const productStatusSchema = z.object({
  id: z.number().int().positive(),
  isActive: z.boolean(),
});

/**
 * Check if user has admin access
 * 
 * @param session User session
 * @returns Whether user has admin access
 */
async function hasAdminAccess(session: any): Promise<boolean> {
  if (!session || !session.user || !session.user.email) {
    return false;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, rankId: true },
  });
  
  // Admin is rank 6 or higher
  return user?.rankId >= 6;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await hasAdminAccess(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    // Handle different actions
    switch (action) {
      case "template":
        // Generate Excel template
        const templateBuffer = generateProductTemplate();
        
        return new NextResponse(templateBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=product_template.xlsx",
          },
        });
      
      case "export":
        // Get all products for export
        const allProducts = await prisma.product.findMany({
          orderBy: { name: "asc" },
        });
        
        // Generate Excel file
        const exportBuffer = exportProductsToExcel(allProducts);
        
        return new NextResponse(exportBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=products_export.xlsx",
          },
        });
      
      case "tags":
        // Get all unique tags
        const tags = await getAllProductTags();
        
        return NextResponse.json({ tags });
      
      default:
        // Get filter parameters
        const search = url.searchParams.get("search") || undefined;
        const tagsParam = url.searchParams.get("tags");
        const isActiveParam = url.searchParams.get("isActive");
        const minPriceParam = url.searchParams.get("minPrice");
        const maxPriceParam = url.searchParams.get("maxPrice");
        const minPvParam = url.searchParams.get("minPv");
        const maxPvParam = url.searchParams.get("maxPv");
        const minInventoryParam = url.searchParams.get("minInventory");
        const maxInventoryParam = url.searchParams.get("maxInventory");
        const sortByParam = url.searchParams.get("sortBy") || undefined;
        const sortOrderParam = url.searchParams.get("sortOrder");
        const pageParam = url.searchParams.get("page");
        const pageSizeParam = url.searchParams.get("pageSize");
        
        // Parse parameters
        const tags = tagsParam ? tagsParam.split(",") : undefined;
        const isActive = isActiveParam ? isActiveParam === "true" : undefined;
        const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
        const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
        const minPv = minPvParam ? parseFloat(minPvParam) : undefined;
        const maxPv = maxPvParam ? parseFloat(maxPvParam) : undefined;
        const minInventory = minInventoryParam ? parseInt(minInventoryParam) : undefined;
        const maxInventory = maxInventoryParam ? parseInt(maxInventoryParam) : undefined;
        const sortOrder = sortOrderParam === "desc" ? "desc" : "asc";
        const page = pageParam ? parseInt(pageParam) : 1;
        const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;
        
        // Get products with filtering and pagination
        const result = await getProducts({
          search,
          tags,
          isActive,
          minPrice,
          maxPrice,
          minPv,
          maxPv,
          minInventory,
          maxInventory,
          sortBy: sortByParam,
          sortOrder,
          page,
          pageSize,
        });
        
        return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await hasAdminAccess(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Get user info
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check content type for file upload
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }
      
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Parse Excel file
      const products = parseProductExcel(buffer);
      
      // Add user info to each product
      products.forEach(product => {
        product.userId = user.id;
        product.userName = user.name;
      });
      
      // Bulk upload products
      const result = await bulkUploadProducts(products, user.id, user.name);
      
      return NextResponse.json(result);
    } else {
      // Handle JSON request
      const body = await request.json();
      const action = body.action || "create";
      
      switch (action) {
        case "create":
          // Validate product data
          const createValidation = productCreateSchema.safeParse(body);
          
          if (!createValidation.success) {
            return NextResponse.json(
              { error: createValidation.error.errors },
              { status: 400 }
            );
          }
          
          // Create product
          const product = await createProduct({
            ...createValidation.data,
            userId: user.id,
            userName: user.name,
          });
          
          return NextResponse.json(product);
        
        case "bulk_update":
          // Validate bulk update data
          const bulkUpdateValidation = bulkUpdateSchema.safeParse(body);
          
          if (!bulkUpdateValidation.success) {
            return NextResponse.json(
              { error: bulkUpdateValidation.error.errors },
              { status: 400 }
            );
          }
          
          // Bulk update products
          const updatedCount = await bulkUpdateProducts(
            bulkUpdateValidation.data.updates.map(update => ({
              id: update.id,
              data: update,
            })),
            user.id,
            user.name
          );
          
          return NextResponse.json({ updatedCount });
        
        case "clone":
          // Validate clone data
          const cloneValidation = productCloneSchema.safeParse(body);
          
          if (!cloneValidation.success) {
            return NextResponse.json(
              { error: cloneValidation.error.errors },
              { status: 400 }
            );
          }
          
          // Clone product
          const clonedProduct = await cloneProduct(
            cloneValidation.data.id,
            cloneValidation.data.newSku,
            user.id,
            user.name
          );
          
          return NextResponse.json(clonedProduct);
        
        case "toggle_status":
          // Validate status data
          const statusValidation = productStatusSchema.safeParse(body);
          
          if (!statusValidation.success) {
            return NextResponse.json(
              { error: statusValidation.error.errors },
              { status: 400 }
            );
          }
          
          // Toggle product status
          const updatedProduct = await toggleProductStatus(
            statusValidation.data.id,
            statusValidation.data.isActive,
            user.id,
            user.name
          );
          
          return NextResponse.json(updatedProduct);
        
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }
  } catch (error) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await hasAdminAccess(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Get user info
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate product data
    const updateValidation = productUpdateSchema.safeParse(body);
    
    if (!updateValidation.success) {
      return NextResponse.json(
        { error: updateValidation.error.errors },
        { status: 400 }
      );
    }
    
    // Update product
    const { id, ...data } = updateValidation.data;
    const product = await updateProduct(id, {
      ...data,
      userId: user.id,
      userName: user.name,
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await hasAdminAccess(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    // Get user info
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get product ID from URL
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    
    if (!idParam) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam);
    
    // Delete product
    const product = await deleteProduct(id, user.id, user.name);
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error in products API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
