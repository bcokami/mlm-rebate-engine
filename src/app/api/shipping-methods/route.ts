import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllShippingMethods, getShippingMethodById } from "@/lib/shippingMethodService";

/**
 * GET /api/shipping-methods
 * Get all shipping methods
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view shipping methods" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const activeOnlyParam = url.searchParams.get("activeOnly");
    
    // If ID is provided, get a specific shipping method
    if (idParam) {
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        return NextResponse.json(
          { error: "Invalid shipping method ID" },
          { status: 400 }
        );
      }
      
      const shippingMethod = await getShippingMethodById(id);
      
      if (!shippingMethod) {
        return NextResponse.json(
          { error: "Shipping method not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(shippingMethod);
    }
    
    // Otherwise, get all shipping methods
    const activeOnly = activeOnlyParam !== "false"; // Default to true
    const shippingMethods = await getAllShippingMethods(activeOnly);
    
    return NextResponse.json(shippingMethods);
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping methods" },
      { status: 500 }
    );
  }
}
