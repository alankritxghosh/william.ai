import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/gemini";
import { withRateLimit } from "@/lib/utils/rate-limiter";
import { extractInsightRequestSchema, validateRequest } from "@/lib/validation/schemas";
import { sanitizeForPrompt, escapePromptContent, createSafePromptSection } from "@/lib/security/sanitizer";

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
  // Check rate limit first
  const rateLimitResponse = await withRateLimit(request, "general");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Check content length header if available
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Request body too large",
            code: "PAYLOAD_TOO_LARGE",
          },
        },
        { status: 413 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    const validation = validateRequest(extractInsightRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: validation.error,
            code: "VALIDATION_ERROR",
          },
        },
        { status: 400 }
      );
    }

    const { answers, flowType } = validation.data;
    
    // Sanitize all user-provided content to prevent prompt injection
    const sanitizedAnswers = sanitizeAnswers(answers);

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

    const result = await generate(prompt);
    
    // Parse JSON from response
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

    return NextResponse.json({
      success: true,
      insight: parsed,
    });
  } catch (error) {
    console.error("Error extracting insight:", error);
    
    // Return generic error message to prevent information leakage
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to extract insight. Please try again.",
          code: "EXTRACTION_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
