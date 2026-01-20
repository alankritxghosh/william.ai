import { 
  GoogleGenerativeAI, 
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { enqueue, getQueueStats, isQueueHealthy } from "@/lib/utils/request-queue";

// ==========================================
// CONFIGURATION
// ==========================================

// Validate API key is configured (server-side only)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY && typeof window === "undefined") {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured. AI generation features will not work.\n" +
    "Please add GEMINI_API_KEY to your .env.local file."
  );
}

// Default timeout for API calls (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

// Cost tracking - Gemini 3.0 Flash pricing (per 1K tokens)
const COST_PER_1K_TOKENS = {
  prompt: 0.00025,
  completion: 0.001,
};

// ==========================================
// COST TRACKING
// ==========================================

interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestCount: number;
}

// Track usage per session (resets on server restart)
const sessionUsage: UsageMetrics = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
  requestCount: 0,
};

// Daily cost warning threshold
const DAILY_COST_WARNING_THRESHOLD = 10; // $10

/**
 * Track API usage for cost monitoring
 */
function trackUsage(promptTokens: number, completionTokens: number): void {
  sessionUsage.promptTokens += promptTokens;
  sessionUsage.completionTokens += completionTokens;
  sessionUsage.totalTokens += promptTokens + completionTokens;
  sessionUsage.requestCount += 1;
  sessionUsage.estimatedCost += 
    (promptTokens / 1000) * COST_PER_1K_TOKENS.prompt +
    (completionTokens / 1000) * COST_PER_1K_TOKENS.completion;
  
  // Log usage in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Gemini] Tokens: ${promptTokens}+${completionTokens}, Total cost: $${sessionUsage.estimatedCost.toFixed(4)}`);
  }
  
  // Warn if cost exceeds threshold
  if (sessionUsage.estimatedCost > DAILY_COST_WARNING_THRESHOLD) {
    console.warn(`[COST WARNING] Session cost: $${sessionUsage.estimatedCost.toFixed(2)} exceeds $${DAILY_COST_WARNING_THRESHOLD} threshold`);
  }
}

/**
 * Get current usage metrics
 */
export function getUsageMetrics(): UsageMetrics {
  return { ...sessionUsage };
}

/**
 * Reset usage metrics (call at start of billing period)
 */
export function resetUsageMetrics(): void {
  sessionUsage.promptTokens = 0;
  sessionUsage.completionTokens = 0;
  sessionUsage.totalTokens = 0;
  sessionUsage.estimatedCost = 0;
  sessionUsage.requestCount = 0;
}

// ==========================================
// SAFETY SETTINGS
// ==========================================

/**
 * Safety settings to prevent harmful content generation
 * Using BLOCK_MEDIUM_AND_ABOVE for balanced content safety
 */
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// ==========================================
// MODEL INITIALIZATION
// ==========================================

// Initialize Gemini AI (API key is server-side only, never exposed to client)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// Get the Gemini 3 Flash model with safety settings
export const gemini: GenerativeModel = genAI.getGenerativeModel({ 
  model: "gemini-3.0-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 4096,
  },
  safetySettings,
});

/**
 * Check if Gemini is properly configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Wrap a promise with a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  operation: string = "API call"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), 
      timeoutMs
    )
  );
  return Promise.race([promise, timeout]);
}

/**
 * Validate and extract text from Gemini response
 */
function validateResponse(result: Awaited<ReturnType<typeof gemini.generateContent>>): string {
  const response = result.response;
  
  // Check for safety blocks
  if (response.promptFeedback?.blockReason) {
    throw new Error(`Content blocked by safety filter: ${response.promptFeedback.blockReason}`);
  }
  
  // Track token usage if available
  if (response.usageMetadata) {
    trackUsage(
      response.usageMetadata.promptTokenCount || 0,
      response.usageMetadata.candidatesTokenCount || 0
    );
  }
  
  // Get text from response
  const text = response.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Empty response from AI model");
  }
  
  return text;
}

// ==========================================
// GENERATION FUNCTIONS
// ==========================================

/**
 * Generate content with a single prompt
 * Includes queue management, timeout handling, response validation, and cost tracking
 */
export async function generate(
  prompt: string, 
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  priority: "normal" | "high" = "normal"
): Promise<string> {
  // Check queue health before adding more requests
  if (!isQueueHealthy()) {
    console.warn("[Gemini] Queue is backing up, request may be delayed");
  }
  
  // Enqueue the request to respect rate limits
  return enqueue(async () => {
    const result = await withTimeout(
      gemini.generateContent(prompt),
      timeoutMs,
      "Content generation"
    );
    return validateResponse(result);
  }, priority);
}

/**
 * Generate multiple versions of content
 */
export async function generateMultiple(
  prompt: string, 
  count: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string[]> {
  const multiPrompt = `${prompt}\n\nGenerate ${count} completely different versions. Number each version as VERSION 1, VERSION 2, etc.`;
  
  // Enqueue the request
  const text = await enqueue(async () => {
    const result = await withTimeout(
      gemini.generateContent(multiPrompt),
      timeoutMs,
      "Multiple content generation"
    );
    return validateResponse(result);
  });
  
  // Parse versions from response
  const versions: string[] = [];
  const versionRegex = /VERSION\s*(\d+):\s*([\s\S]*?)(?=VERSION\s*\d+:|$)/gi;
  let match;
  
  while ((match = versionRegex.exec(text)) !== null) {
    versions.push(match[2].trim());
  }
  
  // If parsing failed, return the whole response as one version
  if (versions.length === 0) {
    versions.push(text);
  }
  
  return versions;
}

/**
 * Generate with retry logic (exponential backoff)
 * Handles transient errors and rate limits gracefully
 */
export async function generateWithRetry(
  prompt: string, 
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generate(prompt, timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on safety blocks - they won't change
      if (lastError.message.includes("Content blocked")) {
        throw lastError;
      }
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  
  throw lastError || new Error("Generation failed after all retries");
}

/**
 * Generate with streaming response
 * Note: Streaming doesn't go through queue as it needs real-time chunks
 */
export async function generateStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  timeoutMs: number = 60000 // Longer timeout for streaming
): Promise<string> {
  // Check queue health - streaming doesn't queue but we still check rate limits
  const stats = getQueueStats();
  if (stats.pending > 10) {
    console.warn("[Gemini] High queue load, streaming may impact rate limits");
  }
  
  const result = await withTimeout(
    gemini.generateContentStream(prompt),
    timeoutMs,
    "Stream generation"
  );
  
  let fullText = "";
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText);
  }
  
  if (!fullText || fullText.trim().length === 0) {
    throw new Error("Empty streaming response from AI model");
  }
  
  // Track usage for streaming (estimated based on text length)
  const estimatedTokens = Math.ceil(fullText.length / 4);
  trackUsage(estimatedTokens, estimatedTokens);
  
  return fullText;
}

/**
 * Extract structured JSON from AI response
 */
export async function generateJSON<T>(
  prompt: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no markdown or explanation.`;
  const result = await generate(jsonPrompt, timeoutMs);
  
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
  
  try {
    return JSON.parse(cleaned.trim()) as T;
  } catch (parseError) {
    throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
  }
}
