import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Validate API key is configured (server-side only)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY && typeof window === "undefined") {
  console.warn(
    "⚠️ GEMINI_API_KEY is not configured. AI generation features will not work.\n" +
    "Please add GEMINI_API_KEY to your .env.local file."
  );
}

// Initialize Gemini AI (API key is server-side only, never exposed to client)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// Get the Gemini 3 Flash model
export const gemini: GenerativeModel = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 4096,
  }
});

/**
 * Check if Gemini is properly configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Generate content with a single prompt
 */
export async function generate(prompt: string): Promise<string> {
  const result = await gemini.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate multiple versions of content
 */
export async function generateMultiple(prompt: string, count: number): Promise<string[]> {
  const multiPrompt = `${prompt}\n\nGenerate ${count} completely different versions. Number each version as VERSION 1, VERSION 2, etc.`;
  const result = await gemini.generateContent(multiPrompt);
  const text = result.response.text();
  
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
 */
export async function generateWithRetry(
  prompt: string, 
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generate(prompt);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Generation failed after all retries");
}

/**
 * Generate with streaming response
 */
export async function generateStream(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const result = await gemini.generateContentStream(prompt);
  let fullText = "";
  
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    onChunk(chunkText);
  }
  
  return fullText;
}

/**
 * Extract structured JSON from AI response
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no markdown or explanation.`;
  const result = await generate(jsonPrompt);
  
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
  
  return JSON.parse(cleaned.trim()) as T;
}
