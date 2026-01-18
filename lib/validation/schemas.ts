/**
 * Zod Validation Schemas for API Inputs
 * 
 * Provides strict validation for all API endpoints to prevent
 * malformed requests, injection attacks, and data corruption.
 */

import { z } from "zod";

// ==========================================
// COMMON VALIDATORS
// ==========================================

// Maximum lengths for text fields (to prevent abuse)
const MAX_ANSWER_LENGTH = 5000;
const MAX_SIGNATURE_PHRASE_LENGTH = 200;
const MAX_POST_CONTENT_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 50;

// Voice Mode IDs
export const voiceModeIdSchema = z.enum([
  "thought-leader",
  "storyteller",
  "educator",
  "provocateur",
  "community-builder",
]);

// Platform types
export const platformSchema = z.enum(["linkedin", "twitter", "both"]);

// Flow types
export const flowTypeSchema = z.enum(["experience", "pattern"]);

// ==========================================
// VOICE PROFILE SCHEMAS
// ==========================================

export const rhythmPreferencesSchema = z.object({
  avgSentenceLength: z.number().min(5).max(100),
  paragraphBreaks: z.enum(["frequent", "moderate", "rare"]),
  punchlinePosition: z.enum(["end", "middle", "start"]),
  questionUsage: z.enum(["never", "occasional", "frequent"]),
});

export const formattingRulesSchema = z.object({
  useEmDash: z.boolean(),
  useBulletPoints: z.boolean(),
  useNumberedLists: z.boolean(),
  emojiUsage: z.enum(["never", "rare", "moderate", "frequent"]),
});

// Minimum total rules required for a valid voice profile
const MIN_TOTAL_RULES = 20;

export const voiceRulesSchema = z.object({
  sentencePatterns: z
    .array(z.string().min(1).max(500))
    .max(MAX_ARRAY_LENGTH),
  forbiddenWords: z
    .array(z.string().min(1).max(100))
    .max(MAX_ARRAY_LENGTH),
  signaturePhrases: z
    .array(z.string().min(1).max(MAX_SIGNATURE_PHRASE_LENGTH))
    .max(MAX_ARRAY_LENGTH),
  rhythmPreferences: rhythmPreferencesSchema,
  formattingRules: formattingRulesSchema,
}).refine(
  (rules) => {
    const totalRules = 
      rules.sentencePatterns.length + 
      rules.forbiddenWords.length + 
      rules.signaturePhrases.length;
    return totalRules >= MIN_TOTAL_RULES;
  },
  {
    message: `Voice profile must have at least ${MIN_TOTAL_RULES} total rules (sentence patterns + forbidden words + signature phrases)`,
    path: ["_totalRules"],
  }
);

export const topPostSchema = z.object({
  content: z.string().max(MAX_POST_CONTENT_LENGTH),
  platform: platformSchema,
  engagement: z.number().min(0),
  url: z.string().url().optional().or(z.literal("")),
});

export const brandColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
});

export const voiceProfileStatsSchema = z.object({
  totalPosts: z.number().min(0),
  avgQualityScore: z.number().min(0).max(100),
  lastUsed: z.string().datetime(),
}).optional();

export const voiceProfileSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  rules: voiceRulesSchema,
  topPosts: z.array(topPostSchema).max(10),
  brandColors: brandColorsSchema,
  stats: voiceProfileStatsSchema,
});

// ==========================================
// INTERVIEW SCHEMAS
// ==========================================

export const interviewAnswersSchema = z.object({
  q1: z.string().min(1).max(MAX_ANSWER_LENGTH),
  q2: z.string().min(1).max(MAX_ANSWER_LENGTH),
  q3: z.string().min(1).max(MAX_ANSWER_LENGTH),
  q4: z.string().min(1).max(MAX_ANSWER_LENGTH),
  q5: z.string().min(1).max(MAX_ANSWER_LENGTH),
  q6: z.string().max(MAX_ANSWER_LENGTH).optional(),
});

export const interviewResponseSchema = z.object({
  id: z.string().min(1).max(100),
  flowType: flowTypeSchema,
  voiceModeId: voiceModeIdSchema,
  voiceProfileId: z.string().min(1).max(100),
  createdAt: z.string().datetime(),
  answers: interviewAnswersSchema,
  extractedInsight: z.string().max(MAX_ANSWER_LENGTH).optional(),
  platform: platformSchema,
  targetAudience: z.string().max(500).optional(),
});

// ==========================================
// API REQUEST SCHEMAS
// ==========================================

/**
 * Schema for /api/generate POST request
 */
export const generateRequestSchema = z.object({
  interview: interviewResponseSchema,
  voiceProfile: voiceProfileSchema,
});

/**
 * Schema for /api/extract-insight POST request
 */
export const extractInsightRequestSchema = z.object({
  flowType: flowTypeSchema,
  answers: z.record(z.string(), z.string().max(MAX_ANSWER_LENGTH)),
  voiceModeId: voiceModeIdSchema.optional(),
});

// ==========================================
// VALIDATION HELPERS
// ==========================================

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type ExtractInsightRequest = z.infer<typeof extractInsightRequestSchema>;
export type VoiceProfile = z.infer<typeof voiceProfileSchema>;
export type InterviewResponse = z.infer<typeof interviewResponseSchema>;

/**
 * Validate and parse request body with helpful error messages
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Format error message for user
  const issues = result.error.issues;
  const errorMessage = issues
    .map(issue => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  
  return {
    success: false,
    error: `Validation failed: ${errorMessage}`,
    details: issues,
  };
}

/**
 * Check if request body size is within limits
 */
export function checkRequestSize(
  body: string,
  maxBytes: number = 1024 * 1024 // 1MB default
): boolean {
  return new Blob([body]).size <= maxBytes;
}
