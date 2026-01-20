/**
 * Insight Extraction API Route
 * 
 * Analyzes user interview answers and extracts key insights.
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
import { generate } from "@/lib/gemini";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/utils/rate-limiter";
import { extractInsightRequestSchema, validateRequest } from "@/lib/validation/schemas";
import { sanitizeForPrompt, escapePromptContent } from "@/lib/security/sanitizer";
import { 
  authenticateRequest, 
  createErrorResponse,
  getUserRateLimitKey,
} from "@/lib/supabase/api-auth";

// Maximum request body size (100KB)
const MAX_BODY_SIZE = 100 * 1024;

/**
 * Sanitize all answers to prevent prompt injection
 */
function sanitizeAnswers(answers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(answers)) {
    if (value) {
      const result = sanitizeForPrompt(value, 5000);
      
      // If content was blocked due to too many suspicious patterns, use empty string
      if (result.blocked) {
        console.warn(`[Security] Answer ${key} blocked due to: ${result.blockedReason}`);
        sanitized[key] = "";
      } else {
        sanitized[key] = escapePromptContent(result.sanitized);
      }
    } else {
      sanitized[key] = "";
    }
  }
  
  return sanitized;
}

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
  // =========================================
  const userRateLimitKey = getUserRateLimitKey(user.id, "extract");
  const rateLimitResult = await checkRateLimit(userRateLimitKey, "general");
  
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
    
    const validation = validateRequest(extractInsightRequestSchema, body);
    if (!validation.success) {
      return createErrorResponse(validation.error, "VALIDATION_ERROR", 400);
    }

    const { answers, flowType } = validation.data;
    
    // =========================================
    // 5. SANITIZE USER INPUT
    // Prevent prompt injection attacks
    // =========================================
    const sanitizedAnswers = sanitizeAnswers(answers);

    // =========================================
    // 6. BUILD PROMPT
    // =========================================
    let prompt: string;

    if (flowType === "experience") {
      prompt = `Analyze this personal experience story and extract the key insight:

=== USER PROVIDED CONTENT ===
What happened: ${sanitizedAnswers.q1}
Results: ${sanitizedAnswers.q2}
Emotional impact: ${sanitizedAnswers.q3}
What they tried instead: ${sanitizedAnswers.q4}
New results: ${sanitizedAnswers.q5}
Theory why: ${sanitizedAnswers.q6}
=== END USER CONTENT ===

Extract:
1. The unique angle (what makes this story different)
2. The emotional hook (what makes readers care)
3. The contrarian element (what goes against common wisdom)

Respond in JSON format:
{
  "insight": "One sentence summary of the core insight",
  "angle": "What makes this story unique",
  "hook": "The emotional or surprising element that grabs attention",
  "contrarian": "The element that goes against common wisdom (optional)"
}`;
    } else {
      prompt = `Analyze this pattern recognition observation and extract the key insight:

=== USER PROVIDED CONTENT ===
Sample size: ${sanitizedAnswers.q1}
Specific examples: ${sanitizedAnswers.q2}
The pattern: ${sanitizedAnswers.q3}
What people miss: ${sanitizedAnswers.q4}
Surprising element: ${sanitizedAnswers.q5}
=== END USER CONTENT ===

Extract:
1. The clear claim (what you're asserting)
2. The blind spot (what others miss)
3. The urgency (why it matters now)

Respond in JSON format:
{
  "pattern": "One sentence summary of the pattern",
  "blindSpot": "What most people miss",
  "urgency": "Why this matters right now",
  "proof": "Key data points or examples to emphasize (optional)"
}`;
    }

    // =========================================
    // 7. CALL AI
    // =========================================
    const result = await generate(prompt);
    
    // =========================================
    // 8. PARSE RESPONSE
    // =========================================
    let parsed;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleaned = result.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      parsed = JSON.parse(cleaned.trim());
    } catch {
      // If JSON parsing fails, return the raw text as insight
      parsed = { insight: result };
    }

    // =========================================
    // 9. RETURN SUCCESS RESPONSE
    // =========================================
    return NextResponse.json(
      {
        success: true,
        insight: parsed,
      },
      {
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    // SECURITY: Log error server-side, return generic message to client
    console.error("[Extract Insight] Error:", error);
    
    return createErrorResponse(
      "Failed to extract insight. Please try again.",
      "EXTRACTION_ERROR",
      500
    );
  }
}
