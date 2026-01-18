import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/pipeline/multi-stage";
import { InterviewResponse, VoiceProfile } from "@/lib/types";
import { withRateLimit, getClientIdentifier, createRateLimitHeaders, checkRateLimit } from "@/lib/utils/rate-limiter";
import { generateRequestSchema, validateRequest } from "@/lib/validation/schemas";

export const maxDuration = 60; // 60 second timeout for generation

// Maximum request body size (500KB)
const MAX_BODY_SIZE = 500 * 1024;

export async function POST(request: NextRequest) {
  // Check rate limit first (using stricter "generate" limit)
  const rateLimitResponse = await withRateLimit(request, "generate");
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
    
    const validation = validateRequest(generateRequestSchema, body);
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

    const { interview, voiceProfile } = validation.data;

    // Generate the post using the pipeline
    // Cast to the internal types (validation ensures structure is correct)
    const post = await generatePost(
      interview as unknown as InterviewResponse,
      voiceProfile as unknown as VoiceProfile
    );
    
    // Get rate limit info for response headers
    const identifier = getClientIdentifier(request);
    const rateLimitStatus = await checkRateLimit(identifier, "generate");
    const rateLimitHeaders = createRateLimitHeaders(rateLimitStatus);

    return NextResponse.json(
      {
        success: true,
        data: post,
      },
      {
        headers: rateLimitHeaders,
      }
    );
  } catch (error) {
    console.error("Generation error:", error);
    
    // Return generic error message to prevent information leakage
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "An error occurred during generation. Please try again.",
          code: "GENERATION_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
