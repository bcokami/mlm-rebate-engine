import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/shield-soap
 * Get Biogen Shield Herbal Care Soap product details
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the product exists
    const product = await prisma.product.findFirst({
      where: {
        sku: "BIOGEN-SHIELD-SOAP",
      },
      include: {
        category: true,
        productImages: true,
        productVariants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Biogen Shield Herbal Care Soap product not found" },
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
    console.error("Error fetching Biogen Shield Herbal Care Soap product:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch Biogen Shield Herbal Care Soap product" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/shield-soap
 * Create or update Biogen Shield Herbal Care Soap product
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
        sku: "BIOGEN-SHIELD-SOAP",
      },
    });
    
    // Get personal care category or create it if it doesn't exist
    let category = await prisma.productCategory.findFirst({
      where: {
        name: "Personal Care",
      },
    });
    
    if (!category) {
      category = await prisma.productCategory.create({
        data: {
          name: "Personal Care",
          description: "Personal care and hygiene products for daily use",
          slug: "personal-care",
        },
      });
    }
    
    // Product data
    const productData = {
      name: "Biogen Shield Herbal Care Soap",
      description: `Biogen Shield Herbal Care Soap is a premium herbal soap formulated with natural ingredients to provide multiple benefits for your skin. This specially crafted soap offers a comprehensive solution for various skin concerns while maintaining the skin's natural balance.

Key Benefits:
- Whitens, renews, and nourishes skin
- Effectively removes body odor
- Acts as a natural deodorizer
- Suitable for feminine wash
- Anti-bacterial properties to protect against germs
- Made with natural herbal ingredients
- Gentle enough for daily use
- Free from harsh chemicals
- Suitable for all skin types

Biogen Shield Herbal Care Soap combines the power of natural herbs with modern skincare science to deliver a soap that not only cleanses but also improves your skin's overall health and appearance. The unique formulation helps to remove impurities while maintaining your skin's natural moisture.

The soap's anti-bacterial properties help protect against harmful germs while its natural deodorizing effect keeps you feeling fresh throughout the day. Regular use helps to gradually lighten and even out skin tone, giving you a more radiant complexion.

Directions for Use:
- For body: Lather on wet skin, massage gently, and rinse thoroughly.
- For feminine wash: Use as directed by a healthcare professional.
- For best results, use daily.

Size: 135g per bar`,
      shortDescription: "A premium herbal soap that whitens, renews, and nourishes skin while providing anti-bacterial protection and deodorizing benefits.",
      sku: "BIOGEN-SHIELD-SOAP",
      price: 120, // ₱120.00
      salePrice: 99, // ₱99.00
      cost: 60, // ₱60.00
      pointValue: 10, // 10 PV
      stock: 200,
      weight: 135, // 135g
      dimensions: "8x5x2cm",
      featured: true,
      categoryId: category.id,
      status: "ACTIVE",
      tags: ["soap", "herbal", "personal care", "anti-bacterial", "whitening", "deodorizer"],
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
        name: "Single Bar",
        sku: "BIOGEN-SHIELD-SOAP-SINGLE",
        price: 120,
        salePrice: 99,
        stock: 100,
        isDefault: true,
      },
    });
    
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "3-Pack",
        sku: "BIOGEN-SHIELD-SOAP-3PACK",
        price: 330,
        salePrice: 280,
        stock: 70,
        isDefault: false,
      },
    });
    
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "6-Pack",
        sku: "BIOGEN-SHIELD-SOAP-6PACK",
        price: 650,
        salePrice: 550,
        stock: 30,
        isDefault: false,
      },
    });
    
    // Create product images
    const imageUrls = [
      "/images/products/shield-soap/shield-soap-main.jpg",
      "/images/products/shield-soap/shield-soap-benefits.jpg",
      "/images/products/shield-soap/shield-soap-packaging.jpg",
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
            title: "Amazing for my sensitive skin!",
            content: "I've tried many soaps that claim to be gentle, but this is the first one that actually delivers. My skin feels soft and clean without any irritation.",
            userId: users[0].id,
          },
          {
            rating: 4,
            title: "Great deodorizing effect",
            content: "I work out a lot and this soap has been excellent at keeping body odor away. The scent is pleasant but not overpowering.",
            userId: users[1].id,
          },
          {
            rating: 5,
            title: "Noticeable skin improvement",
            content: "After using this soap for a month, I've noticed my skin tone is more even and some dark spots have faded. Will definitely buy again!",
            userId: users[2].id,
          },
          {
            rating: 4,
            title: "Good for the whole family",
            content: "We've switched our entire family to this soap. It's gentle enough for the kids but effective for adults too. The anti-bacterial properties give me peace of mind.",
            userId: users[3].id,
          },
          {
            rating: 5,
            title: "Perfect for feminine use",
            content: "I was looking for a gentle soap for feminine use and this has been perfect. No irritation and keeps me feeling fresh all day.",
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
    console.error("Error creating/updating Biogen Shield Herbal Care Soap product:", error);
    
    return NextResponse.json(
      { error: "Failed to create/update Biogen Shield Herbal Care Soap product" },
      { status: 500 }
    );
  }
}
