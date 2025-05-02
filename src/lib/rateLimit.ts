import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

// In-memory store for rate limiting
// In a production environment, you might want to use Redis or another distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

/**
 * Rate limiting middleware for Next.js API routes
 * @param options Rate limiting options
 * @returns Middleware function
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    keyGenerator = (req) => req.ip || "unknown",
  } = options;

  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | undefined> {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get current rate limit data for this key
    const rateLimit = rateLimitStore.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // If the reset time has passed, reset the counter
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + windowMs;
    }

    // Increment the counter
    rateLimit.count++;

    // Update the store
    rateLimitStore.set(key, rateLimit);

    // Set rate limit headers
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set("X-RateLimit-Remaining", Math.max(0, limit - rateLimit.count).toString());
    headers.set("X-RateLimit-Reset", Math.ceil(rateLimit.resetTime / 1000).toString());

    // If the limit is exceeded, return a 429 Too Many Requests response
    if (rateLimit.count > limit) {
      headers.set("Retry-After", Math.ceil((rateLimit.resetTime - now) / 1000).toString());
      
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests, please try again later.",
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    // Otherwise, continue to the next middleware/handler
    return undefined;
  };
}

/**
 * Apply different rate limits based on the request path
 * @param req Next.js request
 * @returns Rate limit middleware result or undefined
 */
export async function applyRateLimit(req: NextRequest): Promise<NextResponse | undefined> {
  const path = req.nextUrl.pathname;
  
  // Authentication endpoints - stricter limits
  if (path.startsWith("/api/auth")) {
    return await rateLimit({
      limit: 10,
      windowMs: 60 * 1000, // 1 minute
    })(req);
  }
  
  // User registration
  if (path === "/api/users" && req.method === "POST") {
    return await rateLimit({
      limit: 5,
      windowMs: 60 * 1000, // 1 minute
    })(req);
  }
  
  // Purchase endpoints
  if (path.startsWith("/api/purchases") && req.method === "POST") {
    return await rateLimit({
      limit: 10,
      windowMs: 60 * 1000, // 1 minute
    })(req);
  }
  
  // General API rate limit
  if (path.startsWith("/api/")) {
    return await rateLimit({
      limit: 100,
      windowMs: 60 * 1000, // 1 minute
    })(req);
  }
  
  return undefined;
}
