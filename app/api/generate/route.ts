/**
 * Post Generation API Route
 * 
 * Generates AI content using the multi-stage pipeline.
 * 
 * SECURITY FEATURES:
 * - Authentication required (double-checked with Supabase)
 * - Per-user rate limiting
 * - Request body size limit
 * - Input validation with Zod
 * - Prompt injection protection via sanitizer
 * - Generic error messages
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/pipeline/multi-stage";
import { InterviewResponse, VoiceProfile } from "@/lib/types";
import { 
  withRateLimit, 
  getClientIdentifier, 
  createRateLimitHeaders, 
  checkRateLimit 
} from "@/lib/utils/rate-limiter";
import { generateRequestSchema, validateRequest } from "@/lib/validation/schemas";
import { 
  authenticateRequest, 
  createErrorResponse,
  getUserRateLimitKey,
} from "@/lib/supabase/api-auth";
import { incrementUserStats } from "@/lib/supabase/database";

export const maxDuration = 60; // 60 second timeout for generation

// Maximum request body size (500KB)
const MAX_BODY_SIZE = 500 * 1024;

export async function POST(request: NextRequest) {
  // =========================================
  // 1. AUTHENTICATION CHECK (Defense in Depth)
  // Middleware already checks, but we verify again
  // =========================================
  const auth = await authenticateRequest();
  if (!auth.success) {
    return auth.response;
  }
  const { user } = auth;

  // =========================================
  // 2. RATE LIMIT CHECK (Per-User)
  // Use user ID instead of just IP for authenticated users
  // =========================================
  const userRateLimitKey = getUserRateLimitKey(user.id, "generate");
  const rateLimitResult = await checkRateLimit(userRateLimitKey, "generate");
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimitResult.retryAfter,
        },
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    // =========================================
    // 3. REQUEST SIZE CHECK
    // =========================================
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return createErrorResponse("Request body too large", "PAYLOAD_TOO_LARGE", 413);
    }

    // =========================================
    // 4. INPUT VALIDATION
    // =========================================
    const body = await request.json();
    
    const validation = validateRequest(generateRequestSchema, body);
    if (!validation.success) {
      return createErrorResponse(validation.error, "VALIDATION_ERROR", 400);
    }

    const { interview, voiceProfile } = validation.data;

    // =========================================
    // 5. GENERATE POST
    // =========================================
    const post = await generatePost(
      interview as unknown as InterviewResponse,
      voiceProfile as unknown as VoiceProfile
    );

    // =========================================
    // 6. UPDATE USER STATS (async, don't wait)
    // =========================================
    // Fire and forget - don't block response
    incrementUserStats(0, 0).catch((err) => {
      console.error("[Generate] Failed to update user stats:", err);
    });

    // =========================================
    // 7. RETURN SUCCESS RESPONSE
    // =========================================
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);

    return NextResponse.json(
      {
        success: true,
        data: post,
        metadata: {
          userId: user.id, // Include for client-side tracking
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: rateLimitHeaders,
      }
    );
  } catch (error) {
    // SECURITY: Log error server-side, return generic message to client
    console.error("[Generate] Error:", error);
    
    return createErrorResponse(
      "An error occurred during generation. Please try again.",
      "GENERATION_ERROR",
      500
    );
  }
}
