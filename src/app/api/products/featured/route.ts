import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { featuredProducts } from "../route";

/**
 * GET /api/products/featured
 * Get featured products
 */
export async function GET(request: NextRequest) {
  try {
    // Check if products exist in the database
    const productsCount = await prisma.product.count({
      where: {
        featured: true,
      },
    });
    
    // If no featured products exist, return the static list
    if (productsCount === 0) {
      return NextResponse.json(featuredProducts);
    }
    
    // Get featured products from the database
    const products = await prisma.product.findMany({
      where: {
        featured: true,
      },
      include: {
        category: true,
        productImages: {
          where: {
            isDefault: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Transform the data to match the expected format
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.shortDescription || product.description.substring(0, 100) + "...",
      price: product.price,
      salePrice: product.salePrice,
      image: product.productImages[0]?.url || "/images/placeholder.png",
      category: product.category?.name || "Uncategorized",
      pointValue: product.pointValue,
      rating: 5, // Default rating
    }));
    
    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    
    // Fallback to static list in case of error
    return NextResponse.json(featuredProducts);
  }
}
