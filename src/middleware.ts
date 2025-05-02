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
      // TODO: Add proper admin check
      // For now, we'll just check if the user ID is 1 (admin)
      if (token.sub !== "1") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

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
