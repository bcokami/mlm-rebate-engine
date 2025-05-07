import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { productSchema, validate } from "@/lib/validation";
import { productCache } from "@/lib/cache";

/**
 * Featured products list
 *
 * This includes the Biogen Extreme, Veggie Coffee, and Shield Soap products
 */
export const featuredProducts = [
  {
    id: 1,
    name: "Biogen Extreme Concentrate",
    description: "Concentrated organic enzyme formula that helps maintain pH balance and oxygenate cells.",
    price: 1100,     // Member price
    srp: 1250,       // Suggested Retail Price for non-members
    salePrice: 1100, // Current sale price (same as member price)
    image: "/images/products/biogen-extreme/biogen-extreme-main.jpg",
    category: "Health Supplements",
    pointValue: 50,
    pv: 50,
    stock: 100,
    featured: true,
  },
  {
    id: 2,
    name: "Veggie Coffee 124 in 1",
    description: "A caffeine-free coffee alternative with 124 natural ingredients that support detoxification, health maintenance, and weight management.",
    price: 850,      // Member price
    srp: 980,        // Suggested Retail Price for non-members
    salePrice: 850,  // Current sale price (same as member price)
    image: "/images/products/veggie-coffee/veggie-coffee-main.jpg",
    category: "Health Supplements",
    pointValue: 40,
    pv: 40,
    stock: 150,
    featured: true,
  },
  {
    id: 3,
    name: "Biogen Shield Herbal Care Soap",
    description: "A premium herbal soap that whitens, renews, and nourishes skin while providing anti-bacterial protection and deodorizing benefits.",
    price: 99,       // Member price
    srp: 120,        // Suggested Retail Price for non-members
    salePrice: 99,   // Current sale price (same as member price)
    image: "/images/products/shield-soap/shield-soap-main.jpg",
    category: "Personal Care",
    pointValue: 10,
    pv: 10,
    stock: 200,
    featured: true,
  },
  {
    id: 4,
    name: "Immune Support Complex",
    description: "Powerful blend of vitamins, minerals, and herbs to support immune system function.",
    price: 850,      // Member price
    srp: 980,        // Suggested Retail Price for non-members
    salePrice: 850,  // Current sale price (same as member price)
    image: "/images/products/immune-support.jpg",
    category: "Health Supplements",
    pointValue: 40,
    pv: 40,
    stock: 75,
    featured: true,
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validation = validate(productSchema, {
      ...body,
      price: parseFloat(body.price),
      srp: parseFloat(body.srp || body.price), // Default SRP to price if not provided
      pv: parseFloat(body.pv || "0"),         // Default PV to 0 if not provided
      rebateConfigs: body.rebateConfigs?.map((config: any) => ({
        level: parseInt(config.level),
        percentage: parseFloat(config.percentage),
      })),
    });

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      );
    }

    const { name, description, price, srp, pv, image, rebateConfigs } = validation.data!;

    // Create the product with rebate configs in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          price,
          srp,
          pv,
          image,
        },
      });

      // Create rebate configs
      if (rebateConfigs && rebateConfigs.length > 0) {
        for (const config of rebateConfigs) {
          await tx.rebateConfig.create({
            data: {
              productId: newProduct.id,
              level: config.level,
              percentage: config.percentage,
            },
          });
        }
      }

      return newProduct;
    });

    // Clear product cache
    productCache.clearNamespace();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const search = url.searchParams.get("search") || "";
    const isActiveParam = url.searchParams.get("isActive");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActiveParam !== null) {
      whereClause.isActive = isActiveParam === "true";
    }

    // Build orderBy clause for sorting
    let orderByClause: any = {};

    if (sortBy === "name") {
      orderByClause.name = sortOrder;
    } else if (sortBy === "price") {
      orderByClause.price = sortOrder;
    } else {
      orderByClause.createdAt = sortOrder;
    }

    // Create cache key based on query parameters
    const cacheKey = `products:${page}:${pageSize}:${search}:${isActiveParam}:${sortBy}:${sortOrder}`;

    // Try to get from cache first
    const result = await productCache.getOrSet(cacheKey, async () => {
      // Get products with pagination
      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          rebateConfigs: {
            orderBy: {
              level: "asc",
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: orderByClause,
      });

      // Get total count for pagination
      const totalProducts = await prisma.product.count({
        where: whereClause,
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalProducts / pageSize);

      return {
        products,
        pagination: {
          page,
          pageSize,
          totalItems: totalProducts,
          totalPages,
        },
      };
    }, 5 * 60 * 1000); // Cache for 5 minutes

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
