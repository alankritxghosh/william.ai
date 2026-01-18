import { NextRequest, NextResponse } from "next/server";
import { generate } from "@/lib/gemini";
import { withRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { answers, flowType } = await request.json();

    let prompt: string;

    if (flowType === "experience") {
      prompt = `Analyze this personal experience story and extract the key insight:

What happened: ${answers.q1}
Results: ${answers.q2}
Emotional impact: ${answers.q3}
What they tried instead: ${answers.q4}
New results: ${answers.q5}
Theory why: ${answers.q6}

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

Sample size: ${answers.q1}
Specific examples: ${answers.q2}
The pattern: ${answers.q3}
What people miss: ${answers.q4}
Surprising element: ${answers.q5}

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
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to extract insight",
          code: "EXTRACTION_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
