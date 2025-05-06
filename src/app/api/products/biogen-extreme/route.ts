import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/biogen-extreme
 * Get Biogen Extreme product details
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the product exists
    const product = await prisma.product.findFirst({
      where: {
        sku: "BIOGEN-EXTREME-30ML",
      },
      include: {
        category: true,
        productImages: true,
        productVariants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Biogen Extreme product not found" },
        { status: 404 }
      );
    }

    // Get product reviews
    const reviews = await prisma.productReview.findMany({
      where: {
        productId: product.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: {
          not: product.id,
        },
      },
      take: 4,
    });

    // Return product details
    return NextResponse.json({
      product,
      reviews,
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching Biogen Extreme product:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch Biogen Extreme product" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/biogen-extreme
 * Create or update Biogen Extreme product
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "You must be an admin to create or update products" },
        { status: 401 }
      );
    }
    
    // Check if the product already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: "BIOGEN-EXTREME-30ML",
      },
    });
    
    // Get health supplements category or create it if it doesn't exist
    let category = await prisma.productCategory.findFirst({
      where: {
        name: "Health Supplements",
      },
    });
    
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: "Health Supplements",
          description: "Natural health supplements and wellness products",
          slug: "health-supplements",
        },
      });
    }
    
    // Product data
    const productData = {
      name: "Biogen Extreme Concentrate",
      description: `Biogen Extreme is a concentrated organic enzyme formula that helps maintain pH balance in the body. This revolutionary product helps oxygenate cells, supporting optimal health at the cellular level.

Key Benefits:
- Helps maintain acid-alkaline balance
- Oxygenates the cells
- Tasteless and odorless in water
- Gluten-free and vegan
- Contains essential minerals and trace minerals
- Supports overall wellness for both body and mind

Biogen Extreme contains bioavailable ionic trace minerals that help maintain healthy pH in the body for optimal health and wellness. The body is constantly working to maintain acid-base balance, commonly known as pH. The most important nutrients in our bodies for maintaining acid-base balance are minerals and trace minerals.

How to Use:
Add 10-15 drops to 8oz of water, 3 times daily or as directed by your healthcare professional.

Size: 30ml (approximately 30-day supply)`,
      shortDescription: "Concentrated organic enzyme formula that helps maintain pH balance and oxygenate cells.",
      sku: "BIOGEN-EXTREME-30ML",
      price: 1250, // ₱1,250.00
      salePrice: 1100, // ₱1,100.00
      cost: 550, // ₱550.00
      pointValue: 50, // 50 PV
      stock: 100,
      weight: 50, // 50g
      dimensions: "3x3x10cm",
      featured: true,
      categoryId: category.id,
      status: "ACTIVE",
      tags: ["pH balance", "organic", "enzyme", "health", "wellness", "minerals"],
    };
    
    let product;
    
    if (existingProduct) {
      // Update existing product
      product = await prisma.product.update({
        where: {
          id: existingProduct.id,
        },
        data: productData,
      });
      
      // Clear existing variants and create new ones
      await prisma.productVariant.deleteMany({
        where: {
          productId: product.id,
        },
      });
    } else {
      // Create new product
      product = await prisma.product.create({
        data: productData,
      });
    }
    
    // Create product variant
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "30ml Bottle",
        sku: "BIOGEN-EXTREME-30ML",
        price: 1250,
        salePrice: 1100,
        stock: 100,
        isDefault: true,
      },
    });
    
    // Create product images
    const imageUrls = [
      "/images/products/biogen-extreme/biogen-extreme-main.jpg",
      "/images/products/biogen-extreme/biogen-extreme-lifestyle.jpg",
      "/images/products/biogen-extreme/biogen-extreme-benefits.jpg",
    ];
    
    // Clear existing images and create new ones
    await prisma.productImage.deleteMany({
      where: {
        productId: product.id,
      },
    });
    
    for (let i = 0; i < imageUrls.length; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrls[i],
          sortOrder: i,
          isDefault: i === 0,
        },
      });
    }
    
    // Create dummy reviews if they don't exist
    const reviewsCount = await prisma.productReview.count({
      where: {
        productId: product.id,
      },
    });
    
    if (reviewsCount === 0) {
      // Get some random users
      const users = await prisma.user.findMany({
        take: 5,
        orderBy: {
          id: "asc",
        },
      });
      
      if (users.length > 0) {
        const reviews = [
          {
            rating: 5,
            title: "Amazing product!",
            content: "I've been using Biogen Extreme for a month now and I feel so much more energetic. Highly recommend!",
            userId: users[0].id,
          },
          {
            rating: 5,
            title: "Life changing",
            content: "This product has completely changed my life. My pH levels are now balanced and I feel great every day.",
            userId: users[1].id,
          },
          {
            rating: 4,
            title: "Good product",
            content: "I like how it's tasteless and easy to add to my daily water intake. I've noticed some improvements in my energy levels.",
            userId: users[2].id,
          },
          {
            rating: 5,
            title: "Best supplement ever",
            content: "I've tried many supplements but this one is by far the best. It's now a permanent part of my daily routine.",
            userId: users[3].id,
          },
          {
            rating: 4,
            title: "Great for overall health",
            content: "I've been using this for 3 weeks and I can definitely feel the difference in my overall health and wellbeing.",
            userId: users[4].id,
          },
        ];
        
        for (const review of reviews) {
          await prisma.productReview.create({
            data: {
              productId: product.id,
              userId: review.userId,
              rating: review.rating,
              title: review.title,
              content: review.content,
            },
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error creating/updating Biogen Extreme product:", error);
    
    return NextResponse.json(
      { error: "Failed to create/update Biogen Extreme product" },
      { status: 500 }
    );
  }
}
