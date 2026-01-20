/**
 * OAuth Callback Route Handler
 * 
 * Handles the callback from OAuth providers (Google, GitHub) and magic links.
 * Exchanges the auth code for a session and redirects to the intended page.
 * 
 * SECURITY NOTES:
 * - Validates the auth code with Supabase
 * - Uses PKCE flow for added security
 * - Sanitizes redirect URL to prevent open redirect attacks
 * - No sensitive data in error messages
 */

import { createRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Validate redirect URL to prevent open redirect attacks
 */
function getSafeRedirectUrl(redirectTo: string | null, origin: string): string {
  const defaultRedirect = "/dashboard";
  
  if (!redirectTo) {
    return defaultRedirect;
  }

  try {
    // If it's a relative path, it's safe
    if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      // Additional check: only allow certain paths
      const allowedPaths = ["/dashboard", "/create", "/voice-profile"];
      const isAllowed = allowedPaths.some((path) => redirectTo.startsWith(path));
      return isAllowed ? redirectTo : defaultRedirect;
    }

    // If it's an absolute URL, verify it's from our origin
    const url = new URL(redirectTo, origin);
    if (url.origin === origin) {
      return url.pathname + url.search;
    }

    // Unknown redirect, use default
    return defaultRedirect;
  } catch {
    return defaultRedirect;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("[Auth Callback] OAuth error:", error, errorDescription);
    
    // Redirect to login with generic error
    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "oauth_error");
    return NextResponse.redirect(loginUrl);
  }

  // Validate code exists
  if (!code) {
    console.error("[Auth Callback] No code provided");
    
    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createRouteHandlerClient();

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange error:", exchangeError.message);
      
      const loginUrl = new URL("/auth/login", requestUrl.origin);
      loginUrl.searchParams.set("error", "exchange_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Get safe redirect URL
    const safeRedirect = getSafeRedirectUrl(redirectTo, requestUrl.origin);

    // Redirect to the intended page
    return NextResponse.redirect(new URL(safeRedirect, requestUrl.origin));
  } catch (err) {
    console.error("[Auth Callback] Unexpected error:", err);
    
    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "unexpected");
    return NextResponse.redirect(loginUrl);
  }
}
