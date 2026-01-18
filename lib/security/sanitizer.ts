/**
 * Input Sanitization for AI Prompts
 * 
 * Prevents prompt injection attacks by:
 * - Detecting and removing malicious prompt patterns
 * - Escaping special characters
 * - Limiting input length
 * - Filtering suspicious content
 */

// Common prompt injection patterns to detect and block
const INJECTION_PATTERNS = [
  // Ignore/override instructions
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
  /override\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|commands?)/gi,
  
  // System prompt manipulation
  /system\s*:\s*/gi,
  /\[system\]/gi,
  /\[\[system\]\]/gi,
  /<system>/gi,
  /<\/system>/gi,
  
  // Role manipulation
  /you\s+are\s+(now\s+)?a\s+(new\s+)?assistant/gi,
  /act\s+as\s+(if\s+you\s+are\s+)?a\s+(different\s+)?/gi,
  /pretend\s+(to\s+be|you\s+are)/gi,
  /roleplay\s+as/gi,
  
  // Jailbreak attempts
  /DAN\s*mode/gi,
  /developer\s*mode/gi,
  /\bDAN\b/g,
  /jailbreak/gi,
  
  // Hidden instructions
  /\x00/g, // Null bytes
  /\u200B/g, // Zero-width space
  /\u200C/g, // Zero-width non-joiner
  /\u200D/g, // Zero-width joiner
  /\uFEFF/g, // Zero-width no-break space
  
  // Base64 encoded content (potential hidden instructions)
  /data:text\/[^;]+;base64,/gi,
  
  // Markdown code execution attempts
  /```\s*(python|javascript|bash|sh|exec|eval|system)/gi,
];

// Patterns that are suspicious but not necessarily malicious
const WARNING_PATTERNS = [
  /instructions?\s*:/gi,
  /prompt\s*:/gi,
  /context\s*:/gi,
  /rules?\s*:/gi,
];

// Maximum lengths for different content types
const MAX_LENGTHS = {
  answer: 5000,
  signaturePhrase: 200,
  postContent: 10000,
  default: 5000,
};

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  warnings: string[];
  blocked: boolean;
  blockedReason?: string;
}

/**
 * Sanitize user input for use in AI prompts
 */
export function sanitizeForPrompt(
  input: string,
  maxLength: number = MAX_LENGTHS.default
): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = input;
  let wasModified = false;
  let blocked = false;
  let blockedReason: string | undefined;

  // Check for empty input
  if (!input || typeof input !== "string") {
    return {
      sanitized: "",
      wasModified: false,
      warnings: [],
      blocked: false,
    };
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check for injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Log for monitoring (in production, send to security monitoring)
      console.warn(`[Security] Potential prompt injection detected: ${pattern.source}`);
      
      // Remove the pattern
      sanitized = sanitized.replace(pattern, "[FILTERED]");
      wasModified = true;
      warnings.push(`Suspicious pattern removed: ${pattern.source.slice(0, 30)}...`);
    }
  }

  // Check for warning patterns (log but don't block)
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(`Potentially suspicious content detected: ${pattern.source}`);
    }
  }

  // Remove control characters (except newlines and tabs)
  const controlCharPattern = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
  if (controlCharPattern.test(sanitized)) {
    sanitized = sanitized.replace(controlCharPattern, "");
    wasModified = true;
    warnings.push("Control characters removed");
  }

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
    wasModified = true;
    warnings.push(`Content truncated to ${maxLength} characters`);
  }

  // Check if content appears to be mostly injection attempts
  const filteredCount = (sanitized.match(/\[FILTERED\]/g) || []).length;
  if (filteredCount > 3) {
    blocked = true;
    blockedReason = "Too many suspicious patterns detected";
    sanitized = "";
  }

  return {
    sanitized,
    wasModified,
    warnings,
    blocked,
    blockedReason,
  };
}

/**
 * Sanitize an object of answers (like interview answers)
 */
export function sanitizeAnswers(
  answers: Record<string, string>
): {
  sanitized: Record<string, string>;
  wasModified: boolean;
  warnings: string[];
  blocked: boolean;
  blockedReason?: string;
} {
  const sanitizedAnswers: Record<string, string> = {};
  let anyModified = false;
  const allWarnings: string[] = [];
  let anyBlocked = false;
  let blockReason: string | undefined;

  for (const [key, value] of Object.entries(answers)) {
    const result = sanitizeForPrompt(value, MAX_LENGTHS.answer);
    sanitizedAnswers[key] = result.sanitized;
    
    if (result.wasModified) {
      anyModified = true;
    }
    
    if (result.warnings.length > 0) {
      allWarnings.push(...result.warnings.map(w => `${key}: ${w}`));
    }
    
    if (result.blocked) {
      anyBlocked = true;
      blockReason = `Answer ${key}: ${result.blockedReason}`;
    }
  }

  return {
    sanitized: sanitizedAnswers,
    wasModified: anyModified,
    warnings: allWarnings,
    blocked: anyBlocked,
    blockedReason: blockReason,
  };
}

/**
 * Escape special characters that could affect prompt structure
 */
export function escapePromptContent(content: string): string {
  return content
    // Escape markdown-like patterns that could break prompt structure
    .replace(/```/g, "'''")
    .replace(/---/g, "- - -")
    .replace(/===/g, "= = =")
    // Escape potential instruction delimiters
    .replace(/\[\[/g, "[ [")
    .replace(/\]\]/g, "] ]")
    .replace(/<</g, "< <")
    .replace(/>>/g, "> >");
}

/**
 * Validate that content doesn't contain dangerous patterns
 * Returns true if content is safe
 */
export function isContentSafe(content: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      return false;
    }
  }
  return true;
}

/**
 * Create a safe prompt section with clear boundaries
 */
export function createSafePromptSection(
  sectionName: string,
  content: string,
  maxLength: number = MAX_LENGTHS.default
): string {
  const sanitized = sanitizeForPrompt(content, maxLength);
  
  if (sanitized.blocked) {
    return `=== ${sectionName.toUpperCase()} ===\n[Content blocked due to security concerns]\n`;
  }

  const escaped = escapePromptContent(sanitized.sanitized);
  
  return `=== ${sectionName.toUpperCase()} ===\n${escaped}\n=== END ${sectionName.toUpperCase()} ===\n`;
}
