import { describe, it, expect } from "vitest";
import {
  voiceModeIdSchema,
  platformSchema,
  flowTypeSchema,
  interviewAnswersSchema,
  voiceRulesSchema,
  brandColorsSchema,
  validateRequest,
  checkRequestSize,
  extractInsightRequestSchema,
} from "@/lib/validation/schemas";

describe("voiceModeIdSchema", () => {
  it("should accept valid voice mode IDs", () => {
    const validModes = [
      "thought-leader",
      "storyteller",
      "educator",
      "provocateur",
      "community-builder",
    ];

    for (const mode of validModes) {
      const result = voiceModeIdSchema.safeParse(mode);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid voice mode IDs", () => {
    const invalidModes = ["invalid", "random", "", "THOUGHT-LEADER"];

    for (const mode of invalidModes) {
      const result = voiceModeIdSchema.safeParse(mode);
      expect(result.success).toBe(false);
    }
  });
});

describe("platformSchema", () => {
  it("should accept valid platforms", () => {
    const validPlatforms = ["linkedin", "twitter", "both"];

    for (const platform of validPlatforms) {
      const result = platformSchema.safeParse(platform);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid platforms", () => {
    const invalidPlatforms = ["facebook", "instagram", "", "LINKEDIN"];

    for (const platform of invalidPlatforms) {
      const result = platformSchema.safeParse(platform);
      expect(result.success).toBe(false);
    }
  });
});

describe("flowTypeSchema", () => {
  it("should accept valid flow types", () => {
    expect(flowTypeSchema.safeParse("experience").success).toBe(true);
    expect(flowTypeSchema.safeParse("pattern").success).toBe(true);
  });

  it("should reject invalid flow types", () => {
    expect(flowTypeSchema.safeParse("invalid").success).toBe(false);
    expect(flowTypeSchema.safeParse("").success).toBe(false);
  });
});

describe("interviewAnswersSchema", () => {
  it("should accept valid interview answers", () => {
    const validAnswers = {
      q1: "First answer",
      q2: "Second answer",
      q3: "Third answer",
      q4: "Fourth answer",
      q5: "Fifth answer",
    };

    const result = interviewAnswersSchema.safeParse(validAnswers);
    expect(result.success).toBe(true);
  });

  it("should accept optional q6", () => {
    const answersWithQ6 = {
      q1: "First answer",
      q2: "Second answer",
      q3: "Third answer",
      q4: "Fourth answer",
      q5: "Fifth answer",
      q6: "Sixth answer",
    };

    const result = interviewAnswersSchema.safeParse(answersWithQ6);
    expect(result.success).toBe(true);
  });

  it("should reject empty required answers", () => {
    const invalidAnswers = {
      q1: "",
      q2: "Answer",
      q3: "Answer",
      q4: "Answer",
      q5: "Answer",
    };

    const result = interviewAnswersSchema.safeParse(invalidAnswers);
    expect(result.success).toBe(false);
  });

  it("should reject answers exceeding max length", () => {
    const invalidAnswers = {
      q1: "a".repeat(6000), // Exceeds 5000 limit
      q2: "Answer",
      q3: "Answer",
      q4: "Answer",
      q5: "Answer",
    };

    const result = interviewAnswersSchema.safeParse(invalidAnswers);
    expect(result.success).toBe(false);
  });

  it("should reject missing required answers", () => {
    const invalidAnswers = {
      q1: "First answer",
      q2: "Second answer",
      // Missing q3, q4, q5
    };

    const result = interviewAnswersSchema.safeParse(invalidAnswers);
    expect(result.success).toBe(false);
  });
});

describe("brandColorsSchema", () => {
  it("should accept valid hex colors", () => {
    const validColors = {
      primary: "#FF5500",
      secondary: "#00ff00",
      accent: "#0000FF",
    };

    const result = brandColorsSchema.safeParse(validColors);
    expect(result.success).toBe(true);
  });

  it("should reject invalid hex colors", () => {
    const invalidColors = [
      { primary: "red", secondary: "#00ff00", accent: "#0000FF" },
      { primary: "#FFF", secondary: "#00ff00", accent: "#0000FF" }, // 3 chars
      { primary: "#GGGGGG", secondary: "#00ff00", accent: "#0000FF" }, // Invalid hex
      { primary: "FF5500", secondary: "#00ff00", accent: "#0000FF" }, // Missing #
    ];

    for (const colors of invalidColors) {
      const result = brandColorsSchema.safeParse(colors);
      expect(result.success).toBe(false);
    }
  });
});

describe("voiceRulesSchema", () => {
  const validRhythmPreferences = {
    avgSentenceLength: 15,
    paragraphBreaks: "moderate" as const,
    punchlinePosition: "end" as const,
    questionUsage: "occasional" as const,
  };

  const validFormattingRules = {
    useEmDash: true,
    useBulletPoints: false,
    useNumberedLists: false,
    emojiUsage: "never" as const,
  };

  it("should accept voice rules with minimum 20 total rules", () => {
    const validRules = {
      sentencePatterns: Array(10).fill("Pattern"),
      forbiddenWords: Array(5).fill("Word"),
      signaturePhrases: Array(5).fill("Phrase"),
      rhythmPreferences: validRhythmPreferences,
      formattingRules: validFormattingRules,
    };

    const result = voiceRulesSchema.safeParse(validRules);
    expect(result.success).toBe(true);
  });

  it("should reject voice rules with fewer than 20 total rules", () => {
    const invalidRules = {
      sentencePatterns: Array(5).fill("Pattern"),
      forbiddenWords: Array(5).fill("Word"),
      signaturePhrases: Array(5).fill("Phrase"), // Only 15 total
      rhythmPreferences: validRhythmPreferences,
      formattingRules: validFormattingRules,
    };

    const result = voiceRulesSchema.safeParse(invalidRules);
    expect(result.success).toBe(false);
  });

  it("should reject empty arrays", () => {
    const invalidRules = {
      sentencePatterns: [],
      forbiddenWords: [],
      signaturePhrases: [],
      rhythmPreferences: validRhythmPreferences,
      formattingRules: validFormattingRules,
    };

    const result = voiceRulesSchema.safeParse(invalidRules);
    expect(result.success).toBe(false);
  });

  it("should reject invalid rhythm preferences", () => {
    const invalidRules = {
      sentencePatterns: Array(10).fill("Pattern"),
      forbiddenWords: Array(5).fill("Word"),
      signaturePhrases: Array(5).fill("Phrase"),
      rhythmPreferences: {
        avgSentenceLength: 200, // Too high (max 100)
        paragraphBreaks: "moderate",
        punchlinePosition: "end",
        questionUsage: "occasional",
      },
      formattingRules: validFormattingRules,
    };

    const result = voiceRulesSchema.safeParse(invalidRules);
    expect(result.success).toBe(false);
  });
});

describe("validateRequest", () => {
  it("should return success with data for valid input", () => {
    const schema = platformSchema;
    const result = validateRequest(schema, "linkedin");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("linkedin");
    }
  });

  it("should return failure with error message for invalid input", () => {
    const schema = platformSchema;
    const result = validateRequest(schema, "invalid");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(result.details).toBeDefined();
      expect(result.details.length).toBeGreaterThan(0);
    }
  });
});

describe("checkRequestSize", () => {
  it("should return true for small requests", () => {
    const smallBody = JSON.stringify({ data: "small" });
    expect(checkRequestSize(smallBody)).toBe(true);
  });

  it("should return false for oversized requests", () => {
    const largeBody = "a".repeat(2 * 1024 * 1024); // 2MB
    expect(checkRequestSize(largeBody)).toBe(false);
  });

  it("should respect custom max size", () => {
    const body = "a".repeat(100);
    expect(checkRequestSize(body, 50)).toBe(false);
    expect(checkRequestSize(body, 200)).toBe(true);
  });
});

describe("extractInsightRequestSchema", () => {
  it("should accept valid extract insight request", () => {
    const validRequest = {
      flowType: "experience",
      answers: {
        q1: "First answer",
        q2: "Second answer",
      },
    };

    const result = extractInsightRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("should accept optional voiceModeId", () => {
    const requestWithVoiceMode = {
      flowType: "pattern",
      answers: { q1: "Answer" },
      voiceModeId: "thought-leader",
    };

    const result = extractInsightRequestSchema.safeParse(requestWithVoiceMode);
    expect(result.success).toBe(true);
  });

  it("should reject invalid flow type", () => {
    const invalidRequest = {
      flowType: "invalid",
      answers: { q1: "Answer" },
    };

    const result = extractInsightRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it("should reject oversized answer values", () => {
    const invalidRequest = {
      flowType: "experience",
      answers: {
        q1: "a".repeat(6000), // Exceeds max
      },
    };

    const result = extractInsightRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });
});
