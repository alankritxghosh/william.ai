/**
 * Next.js Proxy (formerly Middleware) for Supabase Authentication
 * 
 * This proxy runs on every request to:
 * 1. Refresh the auth session (keeps user logged in)
 * 2. Protect routes that require authentication
 * 3. Redirect unauthenticated users to login
 * 
 * Note: In Next.js 16+, middleware.ts is renamed to proxy.ts
 * and the export is renamed from `middleware` to `proxy`
 * 
 * SECURITY NOTES:
 * - Runs on EVERY matched request (zero trust)
 * - Session is validated with Supabase on each request
 * - API routes return 401, page routes redirect to login
 * - Double-check auth in API routes for defense in depth
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  updateSession,
  isProtectedRoute,
  isAuthRoute,
  getLoginUrl,
  createUnauthorizedResponse,
} from "@/lib/supabase/middleware";

async function proxyHandler(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Update session (refresh token if needed)
  const { response, user } = await updateSession(request);

  // Check if route requires authentication
  if (isProtectedRoute(pathname)) {
    if (!user) {
      // API routes: return 401 JSON response
      if (pathname.startsWith("/api/")) {
        return createUnauthorizedResponse();
      }

      // Page routes: redirect to login
      return NextResponse.redirect(getLoginUrl(request));
    }
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (isAuthRoute(pathname) && user) {
    // Don't redirect from callback or confirm routes
    if (!pathname.includes("/callback") && !pathname.includes("/confirm")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

// Export as `proxy` for Next.js 16+
export const proxy = proxyHandler;

// Also export as default and middleware for compatibility
export const middleware = proxyHandler;
export default proxyHandler;

/**
 * Proxy matcher configuration
 * 
 * This defines which routes the proxy runs on.
 * Excludes static files and public assets for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
