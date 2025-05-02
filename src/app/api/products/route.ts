import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { productSchema, validate } from "@/lib/validation";
import { productCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input data
    const validation = validate(productSchema, {
      ...body,
      price: parseFloat(body.price),
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

    const { name, description, price, image, rebateConfigs } = validation.data!;

    // Create the product with rebate configs in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          name,
          description,
          price,
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

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Create cache key based on query parameters
    const cacheKey = `products:${page}:${pageSize}:${search}`;

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
        orderBy: {
          createdAt: 'desc',
        },
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
