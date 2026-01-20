/**
 * Supabase Middleware Utilities
 * 
 * Provides session refresh and auth checking for Next.js middleware.
 * This runs on every request to protected routes.
 * 
 * SECURITY NOTES:
 * - Refreshes session tokens before expiry
 * - Validates session on every request (zero trust)
 * - Redirects unauthenticated users to login
 * - Sets secure cookie options (httpOnly, secure, sameSite)
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Update session in middleware
 * 
 * This function:
 * 1. Creates a Supabase client with request cookies
 * 2. Refreshes the session if needed
 * 3. Sets updated cookies on the response
 * 
 * Call this in your middleware.ts for every request.
 */
export async function updateSession(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase isn't configured, let the request through
    // The app will show appropriate errors
    console.warn("Supabase environment variables not configured");
    return { response, user: null, supabase: null as any };
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set cookies on the request (for downstream handlers)
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        
        // Create new response with updated cookies
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        
        // Set cookies on the response (for the browser)
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            // Security hardening
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
        });
      },
    },
  });

  // IMPORTANT: Do not run any other Supabase methods between
  // createServerClient and supabase.auth.getUser()
  // This refreshes the session if expired
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user, supabase };
}

/**
 * Check if the current path requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    "/dashboard",
    "/create",
    "/voice-profile",
  ];
  
  const protectedApiPaths = [
    "/api/generate",
    "/api/extract-insight",
  ];
  
  // Check page routes
  for (const path of protectedPaths) {
    if (pathname.startsWith(path)) {
      return true;
    }
  }
  
  // Check API routes
  for (const path of protectedApiPaths) {
    if (pathname.startsWith(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if the current path is an auth route (login, signup, etc.)
 */
export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth");
}

/**
 * Check if the current path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    "/",
    "/api/health",
    "/_next",
    "/favicon.ico",
  ];
  
  for (const path of publicPaths) {
    if (pathname === path || pathname.startsWith(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the login URL with redirect parameter
 */
export function getLoginUrl(request: NextRequest): string {
  const url = new URL("/auth/login", request.url);
  
  // Don't add redirect for API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
  }
  
  return url.toString();
}

/**
 * Create an unauthorized response for API routes
 */
export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Authentication required",
        code: "UNAUTHORIZED",
      },
    },
    { status: 401 }
  );
}
