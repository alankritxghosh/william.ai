/**
 * API Route Authentication Helper
 * 
 * Provides authentication utilities for API routes with defense-in-depth pattern.
 * Even though middleware checks auth, API routes MUST double-check.
 * 
 * SECURITY NOTES:
 * - Middleware can be bypassed in some edge cases
 * - Always verify auth in the route handler itself
 * - Use getUser() not getSession() for validation
 * - Rate limiting should be per-user, not just per-IP
 */

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "./server";
import type { User } from "@supabase/supabase-js";

/**
 * Standard API error response
 */
export interface APIErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * Standard API success response
 */
export interface APISuccessResponse<T> {
  success: true;
  data: T;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Create an error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number = 400
): NextResponse<APIErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { message, code },
    },
    { status }
  );
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<APISuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Authenticate API request and return user
 * 
 * This is the primary auth check for API routes.
 * Returns the user if authenticated, or an error response if not.
 * 
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const auth = await authenticateRequest();
 *   if (!auth.success) return auth.response;
 *   
 *   const { user, supabase } = auth;
 *   // user is guaranteed to be authenticated here
 * }
 * ```
 */
export async function authenticateRequest(): Promise<
  | { success: true; user: User; supabase: Awaited<ReturnType<typeof createRouteHandlerClient>> }
  | { success: false; response: NextResponse<APIErrorResponse> }
> {
  try {
    const supabase = await createRouteHandlerClient();
    
    // IMPORTANT: Use getUser(), not getSession()
    // getUser() makes a request to Supabase to validate the JWT
    // getSession() only decodes locally and can be spoofed
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        success: false,
        response: createErrorResponse(
          "Authentication required",
          "UNAUTHORIZED",
          401
        ),
      };
    }
    
    return {
      success: true,
      user,
      supabase,
    };
  } catch (error) {
    console.error("[API Auth] Error:", error);
    return {
      success: false,
      response: createErrorResponse(
        "Authentication failed",
        "AUTH_ERROR",
        401
      ),
    };
  }
}

/**
 * Rate limit key generator for per-user rate limiting
 * 
 * SECURITY: Rate limit by user ID, not just IP
 * This prevents a single user from exhausting limits across IPs
 */
export function getUserRateLimitKey(userId: string, endpoint: string): string {
  return `rate:user:${userId}:${endpoint}`;
}

/**
 * Verify user owns a resource
 * 
 * Use this before any operation on user-owned data.
 * Even with RLS, explicit checks add defense in depth.
 */
export async function verifyResourceOwnership(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  table: "voice_profiles" | "generated_posts",
  resourceId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", resourceId)
    .eq("user_id", userId)
    .single();
  
  return !error && !!data;
}

/**
 * Wrapper for API route handlers with automatic auth check
 * 
 * Usage:
 * ```ts
 * export const POST = withAuth(async (request, { user, supabase }) => {
 *   // user is guaranteed to be authenticated
 *   const body = await request.json();
 *   // ... handle request
 *   return createSuccessResponse({ result: "ok" });
 * });
 * ```
 */
export function withAuth<T>(
  handler: (
    request: Request,
    context: {
      user: User;
      supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>;
    }
  ) => Promise<NextResponse<APIResponse<T>>>
) {
  return async (request: Request): Promise<NextResponse<APIResponse<T>>> => {
    const auth = await authenticateRequest();
    
    if (!auth.success) {
      return auth.response as NextResponse<APIResponse<T>>;
    }
    
    return handler(request, {
      user: auth.user,
      supabase: auth.supabase,
    });
  };
}

/**
 * Sanitize user data for API responses
 * 
 * SECURITY: Never expose sensitive user fields
 */
export function sanitizeUserForResponse(user: User): {
  id: string;
  email: string | undefined;
  created_at: string | undefined;
} {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };
}
