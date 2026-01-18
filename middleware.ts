/**
 * Next.js Middleware
 * 
 * Handles:
 * - Authentication protection for routes
 * - CORS configuration (restrictive)
 * - Request validation
 * - Security checks
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";

// ==========================================
// CONFIGURATION
// ==========================================

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/create",
  "/voice-profile",
  "/api/generate",
  "/api/extract-insight",
];

// Public routes (accessible without auth)
const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/api/auth",
];

// API routes
const apiRoutes = ["/api/"];

// Allowed origins for CORS (same-origin by default, add specific origins if needed)
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Add the app URL if configured
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  
  // Add localhost for development
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
    origins.push("http://127.0.0.1:3000");
  }
  
  // Add production domains
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }
  
  return origins;
};

// ==========================================
// MIDDLEWARE
// ==========================================

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(route)
  );

  // Check if it's an API route
  const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route));

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS" && isApiRoute) {
    return handleCorsPreflightRequest(req);
  }

  // Handle protected routes
  if (isProtectedRoute && !isLoggedIn) {
    if (isApiRoute) {
      // Return 401 for API routes
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            message: "Authentication required",
            code: "UNAUTHORIZED",
          },
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Redirect to sign in for page routes
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && pathname.startsWith("/auth/signin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Add security headers to response
  const response = NextResponse.next();

  // Add restrictive CORS headers for API routes
  if (isApiRoute) {
    addCorsHeaders(req, response);
  }

  return response;
});

// ==========================================
// CORS HELPERS
// ==========================================

/**
 * Handle CORS preflight (OPTIONS) requests
 */
function handleCorsPreflightRequest(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  }
  
  // Reject unknown origins
  return new NextResponse(null, { status: 403 });
}

/**
 * Add CORS headers to response (restrictive - only allowed origins)
 */
function addCorsHeaders(req: NextRequest, response: NextResponse): void {
  const origin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  
  // Only add CORS headers for allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  // If no origin or unknown origin, don't add CORS headers (same-origin requests work fine)
}

export const config = {
  // Match all routes except static files and images
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
