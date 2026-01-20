/**
 * Email Confirmation Route Handler
 * 
 * Handles email verification links sent by Supabase.
 * This is used for:
 * - Email signup verification
 * - Password reset confirmation
 * - Email change confirmation
 * 
 * SECURITY NOTES:
 * - Token is validated by Supabase
 * - Sanitizes redirect URL
 * - Generic error messages
 */

import { createRouteHandlerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // Supabase sends tokens as hash parameters, but Next.js can also receive them as query params
  // The token_hash and type are sent by Supabase
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as
    | "signup"
    | "recovery"
    | "invite"
    | "magiclink"
    | "email_change"
    | null;
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard";

  // Validate required parameters
  if (!tokenHash || !type) {
    console.error("[Email Confirm] Missing token_hash or type");
    
    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createRouteHandlerClient();

    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error("[Email Confirm] Verification error:", error.message);
      
      const loginUrl = new URL("/auth/login", requestUrl.origin);
      loginUrl.searchParams.set("error", "verification_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Determine redirect based on type
    let finalRedirect = redirectTo;
    let successMessage = "";

    switch (type) {
      case "signup":
        successMessage = "Email verified! You can now sign in.";
        finalRedirect = "/auth/login";
        break;
      case "recovery":
        // For password recovery, redirect to password reset page
        finalRedirect = "/auth/reset-password";
        break;
      case "magiclink":
        // Magic link login - redirect to intended page
        finalRedirect = redirectTo;
        break;
      case "email_change":
        successMessage = "Email changed successfully.";
        finalRedirect = "/dashboard";
        break;
      default:
        finalRedirect = "/dashboard";
    }

    // Build redirect URL with optional success message
    const redirectUrl = new URL(finalRedirect, requestUrl.origin);
    if (successMessage) {
      redirectUrl.searchParams.set("message", successMessage);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[Email Confirm] Unexpected error:", err);
    
    const loginUrl = new URL("/auth/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "unexpected");
    return NextResponse.redirect(loginUrl);
  }
}
