import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/pipeline/multi-stage";
import { InterviewResponse, VoiceProfile } from "@/lib/types";
import { withRateLimit, getClientIdentifier, createRateLimitHeaders, checkRateLimit } from "@/lib/utils/rate-limiter";

export const maxDuration = 60; // 60 second timeout for generation

export async function POST(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { interview, voiceProfile } = await request.json() as {
      interview: InterviewResponse;
      voiceProfile: VoiceProfile;
    };

    if (!interview || !voiceProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing interview data or voice profile",
            code: "INVALID_INPUT",
          },
        },
        { status: 400 }
      );
    }

    // Generate the post using the pipeline
    const post = await generatePost(interview, voiceProfile);
    
    // Get rate limit info for response headers
    const identifier = getClientIdentifier(request);
    const rateLimitStatus = checkRateLimit(identifier);
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: errorMessage,
          code: "GENERATION_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
