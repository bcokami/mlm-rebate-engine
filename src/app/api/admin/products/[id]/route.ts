import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getProductById, 
  getProductAuditLogs,
  getProductSalesHistory,
  simulateProductRebates
} from "@/lib/productService";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!await hasAdminAccess(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }
    
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    // Handle different actions
    switch (action) {
      case "audit":
        // Get pagination parameters
        const limitParam = url.searchParams.get("limit");
        const offsetParam = url.searchParams.get("offset");
        
        const limit = limitParam ? parseInt(limitParam) : 10;
        const offset = offsetParam ? parseInt(offsetParam) : 0;
        
        // Get audit logs
        const auditResult = await getProductAuditLogs(id, limit, offset);
        
        return NextResponse.json(auditResult);
      
      case "sales":
        // Get months parameter
        const monthsParam = url.searchParams.get("months");
        const months = monthsParam ? parseInt(monthsParam) : 12;
        
        // Get sales history
        const salesHistory = await getProductSalesHistory(id, months);
        
        return NextResponse.json({ salesHistory });
      
      case "simulate":
        // Get simulation parameters
        const quantityParam = url.searchParams.get("quantity");
        const maxLevelParam = url.searchParams.get("maxLevel");
        
        const quantity = quantityParam ? parseInt(quantityParam) : 1;
        const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : 6;
        
        // Simulate rebates
        const simulation = await simulateProductRebates(id, quantity, maxLevel);
        
        return NextResponse.json({ simulation });
      
      default:
        // Get product details
        const product = await getProductById(id);
        
        if (!product) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }
        
        return NextResponse.json(product);
    }
  } catch (error) {
    console.error("Error in product details API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
