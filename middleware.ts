/**
 * Next.js Middleware for Authentication
 * 
 * This middleware runs on every request to:
 * 1. Refresh the auth session (keeps user logged in)
 * 2. Protect routes that require authentication
 * 3. Redirect unauthenticated users to login
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
  isPublicRoute,
  getLoginUrl,
  createUnauthorizedResponse,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
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

/**
 * Middleware matcher configuration
 * 
 * This defines which routes the middleware runs on.
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
