import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/veggie-coffee
 * Get Veggie Coffee product details
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the product exists
    const product = await prisma.product.findFirst({
      where: {
        sku: "VEGGIE-COFFEE-124",
      },
      include: {
        category: true,
        productImages: true,
        productVariants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Veggie Coffee product not found" },
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
    console.error("Error fetching Veggie Coffee product:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch Veggie Coffee product" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/veggie-coffee
 * Create or update Veggie Coffee product
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
        sku: "VEGGIE-COFFEE-124",
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
      name: "Veggie Coffee 124 in 1",
      description: `Veggie Coffee 124 in 1 is a unique blend of 124 natural ingredients that provide a coffee-like taste without any caffeine. This healthy alternative to regular coffee offers numerous health benefits while satisfying your coffee cravings.

Key Benefits:
- Caffeine-free coffee alternative with natural flavor
- Contains 124 natural ingredients for comprehensive nutrition
- Supports detoxification when taken before meals
- Helps maintain good health when taken during meals
- Aids in weight management when taken after meals
- 100% natural and plant-based ingredients
- No artificial flavors, colors, or preservatives

Veggie Coffee 124 in 1 is perfect for those who love the taste of coffee but want to avoid caffeine and gain additional health benefits. Each sachet contains a carefully selected blend of vegetables, fruits, herbs, and other natural ingredients that work synergistically to support your overall health.

How to Use:
- For detoxification: Take one sachet before meals
- To maintain good health: Take one sachet during meals
- For weight management: Take one sachet after meals

Simply mix one sachet with hot water, stir well, and enjoy your healthy, delicious cup of Veggie Coffee.

Size: Box of 10 sachets (15g each)`,
      shortDescription: "A caffeine-free coffee alternative with 124 natural ingredients that support detoxification, health maintenance, and weight management.",
      sku: "VEGGIE-COFFEE-124",
      price: 980, // ₱980.00
      salePrice: 850, // ₱850.00
      cost: 450, // ₱450.00
      pointValue: 40, // 40 PV
      stock: 150,
      weight: 150, // 150g (10 sachets x 15g)
      dimensions: "15x10x5cm",
      featured: true,
      categoryId: category.id,
      status: "ACTIVE",
      tags: ["coffee alternative", "caffeine-free", "detox", "weight management", "natural", "veggie"],
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
    
    // Create product variants
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "10 Sachets Box",
        sku: "VEGGIE-COFFEE-124-10",
        price: 980,
        salePrice: 850,
        stock: 100,
        isDefault: true,
      },
    });
    
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "30 Sachets Box",
        sku: "VEGGIE-COFFEE-124-30",
        price: 2800,
        salePrice: 2500,
        stock: 50,
        isDefault: false,
      },
    });
    
    // Create product images
    const imageUrls = [
      "/images/products/veggie-coffee/veggie-coffee-main.jpg",
      "/images/products/veggie-coffee/veggie-coffee-lifestyle.jpg",
      "/images/products/veggie-coffee/veggie-coffee-benefits.jpg",
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
            title: "Great coffee alternative!",
            content: "I've been looking for a caffeine-free coffee alternative for a long time, and this is perfect! It tastes great and has so many health benefits.",
            userId: users[0].id,
          },
          {
            rating: 4,
            title: "Tastes surprisingly good",
            content: "I was skeptical at first, but this veggie coffee actually tastes quite good. I've been taking it after meals and have noticed some weight management benefits.",
            userId: users[1].id,
          },
          {
            rating: 5,
            title: "Amazing product",
            content: "I love that this has 124 natural ingredients. I feel healthier already after just two weeks of using it. Will definitely buy again!",
            userId: users[2].id,
          },
          {
            rating: 4,
            title: "Good for detox",
            content: "I've been taking this before meals as recommended for detoxification, and I can feel the difference. My digestion has improved significantly.",
            userId: users[3].id,
          },
          {
            rating: 5,
            title: "Perfect replacement for coffee",
            content: "As someone who had to give up caffeine for health reasons, this product has been a lifesaver. It satisfies my coffee cravings without the negative effects.",
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
    console.error("Error creating/updating Veggie Coffee product:", error);
    
    return NextResponse.json(
      { error: "Failed to create/update Veggie Coffee product" },
      { status: 500 }
    );
  }
}
