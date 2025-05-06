import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Product categories list
 */
export const productCategories = [
  {
    id: 1,
    name: "Health Supplements",
    description: "Natural health supplements and wellness products",
    slug: "health-supplements",
    featured: true,
  },
  {
    id: 2,
    name: "Personal Care",
    description: "Personal care and hygiene products for daily use",
    slug: "personal-care",
    featured: true,
  },
  {
    id: 3,
    name: "Beauty & Skincare",
    description: "Premium beauty and skincare products for all skin types",
    slug: "beauty-skincare",
    featured: true,
  },
  {
    id: 4,
    name: "Weight Management",
    description: "Products to support healthy weight management goals",
    slug: "weight-management",
    featured: false,
  },
];

/**
 * GET /api/product-categories
 * Get all product categories
 */
export async function GET(request: NextRequest) {
  try {
    // Check if categories exist in the database
    const categoriesCount = await prisma.productCategory.count();
    
    // If no categories exist, create them from the default list
    if (categoriesCount === 0) {
      await Promise.all(
        productCategories.map(async (category) => {
          await prisma.productCategory.create({
            data: {
              name: category.name,
              description: category.description,
              slug: category.slug,
              featured: category.featured,
            },
          });
        })
      );
    }
    
    // Get all categories from the database
    const categories = await prisma.productCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch product categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-categories
 * Create a new product category
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You must be an admin to create product categories" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }
    
    // Check if category with the same slug already exists
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        slug: body.slug,
      },
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      );
    }
    
    // Create the new category
    const category = await prisma.productCategory.create({
      data: {
        name: body.name,
        description: body.description || "",
        slug: body.slug,
        featured: body.featured || false,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating product category:", error);
    
    return NextResponse.json(
      { error: "Failed to create product category" },
      { status: 500 }
    );
  }
}
