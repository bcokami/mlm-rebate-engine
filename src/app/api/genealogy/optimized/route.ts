import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getOptimizedDownline, 
  getOptimizedDownlineStatistics, 
  loadOptimizedAdditionalLevels,
  GenealogyQueryOptions
} from "@/lib/optimizedGenealogyService";
import { config } from "@/env";
import { z } from "zod";
import { performance } from "perf_hooks";

// Rate limiting
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Apply rate limiting to requests
 * 
 * @param ip Client IP address
 * @returns Whether the request should be allowed
 */
function applyRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.max;
  
  // Get or initialize request count for this IP
  let requestData = ipRequestCounts.get(ip);
  
  if (!requestData || now > requestData.resetTime) {
    // Initialize or reset counter
    requestData = { count: 0, resetTime: now + windowMs };
    ipRequestCounts.set(ip, requestData);
  }
  
  // Increment count
  requestData.count++;
  
  // Check if limit exceeded
  return requestData.count <= maxRequests;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  
  for (const [ip, data] of ipRequestCounts.entries()) {
    if (now > data.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupRateLimits, 60000);

/**
 * GET /api/genealogy/optimized
 * Get a user's downline with optimized performance
 */
export async function GET(request: NextRequest) {
  // Start performance measurement
  const startTime = performance.now();
  
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    
    // Apply rate limiting
    if (!applyRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy" },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    const maxLevelParam = url.searchParams.get("maxLevel");
    const pageParam = url.searchParams.get("page");
    const pageSizeParam = url.searchParams.get("pageSize");
    
    // Parse and validate userId
    let userId: number;
    
    if (userIdParam) {
      userId = parseInt(userIdParam);
      
      if (isNaN(userId)) {
        return NextResponse.json(
          { error: "Invalid user ID" },
          { status: 400 }
        );
      }
    } else {
      // Use the logged-in user's ID if no userId is provided
      userId = parseInt(session.user.id);
    }
    
    // Parse and validate maxLevel
    const maxLevel = maxLevelParam ? parseInt(maxLevelParam) : config.maxGenealogyDepth;
    
    if (isNaN(maxLevel) || maxLevel < 1) {
      return NextResponse.json(
        { error: "Invalid max level" },
        { status: 400 }
      );
    }
    
    // Parse and validate page and pageSize
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;
    
    if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }
    
    // Parse filter and sort options
    const filterRankParam = url.searchParams.get("filterRank");
    const filterMinSalesParam = url.searchParams.get("filterMinSales");
    const filterMaxSalesParam = url.searchParams.get("filterMaxSales");
    const filterJoinedAfterParam = url.searchParams.get("filterJoinedAfter");
    const filterJoinedBeforeParam = url.searchParams.get("filterJoinedBefore");
    const sortByParam = url.searchParams.get("sortBy");
    const sortDirectionParam = url.searchParams.get("sortDirection");
    const includePerformanceMetricsParam = url.searchParams.get("includePerformanceMetrics");
    const lazyLoadLevelsParam = url.searchParams.get("lazyLoadLevels");
    const includeMetadataParam = url.searchParams.get("includeMetadata");
    
    // Build options object
    const options: GenealogyQueryOptions = {};
    
    if (filterRankParam) {
      const filterRank = parseInt(filterRankParam);
      if (!isNaN(filterRank)) {
        options.filterRank = filterRank;
      }
    }
    
    if (filterMinSalesParam) {
      const filterMinSales = parseFloat(filterMinSalesParam);
      if (!isNaN(filterMinSales)) {
        options.filterMinSales = filterMinSales;
      }
    }
    
    if (filterMaxSalesParam) {
      const filterMaxSales = parseFloat(filterMaxSalesParam);
      if (!isNaN(filterMaxSales)) {
        options.filterMaxSales = filterMaxSales;
      }
    }
    
    if (filterJoinedAfterParam) {
      try {
        options.filterJoinedAfter = new Date(filterJoinedAfterParam);
      } catch (error) {
        // Ignore invalid date
      }
    }
    
    if (filterJoinedBeforeParam) {
      try {
        options.filterJoinedBefore = new Date(filterJoinedBeforeParam);
      } catch (error) {
        // Ignore invalid date
      }
    }
    
    if (sortByParam) {
      const validSortBy = ['name', 'createdAt', 'rank', 'downlineCount', 'sales'];
      if (validSortBy.includes(sortByParam as any)) {
        options.sortBy = sortByParam as any;
      }
    }
    
    if (sortDirectionParam) {
      const validSortDirection = ['asc', 'desc'];
      if (validSortDirection.includes(sortDirectionParam as any)) {
        options.sortDirection = sortDirectionParam as any;
      }
    }
    
    if (includePerformanceMetricsParam === 'true') {
      options.includePerformanceMetrics = true;
    }
    
    if (lazyLoadLevelsParam === 'true') {
      options.lazyLoadLevels = true;
    }
    
    if (includeMetadataParam === 'true') {
      options.includeMetadata = true;
    }
    
    // Get downline data
    const result = await getOptimizedDownline(userId, maxLevel, page, pageSize, options);
    
    // End performance measurement
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // Add execution time to response
    result.metadata.apiExecutionTime = executionTime.toFixed(2) + 'ms';
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching genealogy:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch genealogy data" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/genealogy/optimized/statistics
 * Get statistics about a user's downline
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view genealogy statistics" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const schema = z.object({
      userId: z.number().int().positive(),
      maxLevel: z.number().int().positive().optional(),
      loadAdditionalLevels: z.boolean().optional(),
      parentId: z.number().int().positive().optional(),
      currentLevel: z.number().int().nonnegative().optional(),
    });
    
    const validationResult = schema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { userId, maxLevel = config.maxGenealogyDepth, loadAdditionalLevels, parentId, currentLevel } = validationResult.data;
    
    // Check if we're loading additional levels or getting statistics
    if (loadAdditionalLevels && parentId !== undefined && currentLevel !== undefined) {
      // Load additional levels
      const result = await loadOptimizedAdditionalLevels(parentId, currentLevel, maxLevel);
      return NextResponse.json(result);
    } else {
      // Get statistics
      const result = await getOptimizedDownlineStatistics(userId, maxLevel);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error fetching genealogy data:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch genealogy data" },
      { status: 500 }
    );
  }
}
