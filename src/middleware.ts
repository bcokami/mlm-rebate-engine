import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { applyRateLimit } from "./lib/rateLimit";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting
  if (pathname.startsWith("/api/")) {
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  // Check if the path is protected
  const protectedPaths = [
    "/dashboard",
    "/shop",
    "/wallet",
    "/rebates",
    "/genealogy",
    "/admin",
  ];

  const isPathProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isPathProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If the user is not logged in, redirect to the login page
    if (!token) {
      const url = new URL(`/login`, request.url);
      url.searchParams.set("callbackUrl", encodeURI(pathname));
      return NextResponse.redirect(url);
    }

    // If the user is trying to access admin routes, check if they have admin privileges
    if (pathname.startsWith("/admin")) {
      try {
        // Fetch the user from the database to check their rank
        const response = await fetch(`${request.nextUrl.origin}/api/users/me`, {
          headers: {
            Cookie: request.headers.get('cookie') || '',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch user data:', response.statusText);
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        const userData = await response.json();

        // Check if the user has Diamond rank (rankId 6)
        if (!userData || userData.rankId !== 6) {
          console.log('Access denied: User does not have admin privileges');
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  // Add cache control headers for API routes
  if (pathname.startsWith('/api/')) {
    // For optimized genealogy API, add cache control headers
    if (pathname.startsWith('/api/genealogy/optimized')) {
      // Cache for a short time (5 minutes)
      response.headers.set(
        'Cache-Control',
        'public, max-age=300, s-maxage=300, stale-while-revalidate=60'
      );
    } else if (pathname.startsWith('/api/products/')) {
      // Cache product data for longer (1 hour)
      response.headers.set(
        'Cache-Control',
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300'
      );
    } else if (pathname.startsWith('/api/ranks/')) {
      // Cache rank data for longer (1 day)
      response.headers.set(
        'Cache-Control',
        'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600'
      );
    } else {
      // Default for other API routes - no caching
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
    }
  }

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self'"
  );

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Enable XSS protection in browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security (use in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}
