/**
 * Error Sanitization Utilities
 * 
 * Prevents information leakage through error messages by:
 * - Removing sensitive data from errors
 * - Providing generic messages to users
 * - Logging detailed errors server-side only
 * - Capturing errors to Sentry with redacted sensitive data
 */

import * as Sentry from "@sentry/nextjs";

// Patterns that might indicate sensitive information in error messages
const SENSITIVE_PATTERNS = [
  // API keys and tokens
  /api[_-]?key[:\s]*[^\s]+/gi,
  /token[:\s]*[^\s]+/gi,
  /bearer\s+[^\s]+/gi,
  /authorization[:\s]*[^\s]+/gi,
  
  // Credentials
  /password[:\s]*[^\s]+/gi,
  /secret[:\s]*[^\s]+/gi,
  /credential[:\s]*[^\s]+/gi,
  
  // File paths that might reveal system structure
  /\/Users\/[^\s]+/gi,
  /\/home\/[^\s]+/gi,
  /C:\\Users\\[^\s]+/gi,
  /\/var\/[^\s]+/gi,
  
  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Database connection strings
  /mongodb(\+srv)?:\/\/[^\s]+/gi,
  /postgres(ql)?:\/\/[^\s]+/gi,
  /mysql:\/\/[^\s]+/gi,
  /redis:\/\/[^\s]+/gi,
  
  // Stack traces with line numbers
  /at\s+[^\s]+\s+\([^)]+:\d+:\d+\)/g,
  
  // Environment variable names that might hint at infrastructure
  /process\.env\.[A-Z_]+/g,
];

// Generic error messages for different error types
const GENERIC_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "The request data is invalid. Please check your input and try again.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
  UNAUTHORIZED: "Authentication required. Please sign in to continue.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  GENERATION_ERROR: "Content generation failed. Please try again.",
  EXTRACTION_ERROR: "Failed to process your request. Please try again.",
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

export interface SanitizedError {
  message: string;
  code: string;
  safe: boolean;
}

/**
 * Check if an error message contains sensitive information
 */
export function containsSensitiveInfo(message: string): boolean {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(message)) {
      return true;
    }
  }
  return false;
}

/**
 * Remove sensitive information from an error message
 */
export function redactSensitiveInfo(message: string): string {
  let redacted = message;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  
  return redacted;
}

/**
 * Get a safe, generic error message based on error code
 */
export function getGenericMessage(code: string): string {
  return GENERIC_MESSAGES[code] || GENERIC_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Sanitize an error for safe client-side display
 */
export function sanitizeError(
  error: unknown,
  defaultCode: string = "UNKNOWN_ERROR"
): SanitizedError {
  // Handle null/undefined
  if (!error) {
    return {
      message: getGenericMessage(defaultCode),
      code: defaultCode,
      safe: true,
    };
  }

  // Extract error message
  let originalMessage = "Unknown error";
  let code = defaultCode;

  if (error instanceof Error) {
    originalMessage = error.message;
    // Check for code property
    const errorWithCode = error as Error & { code?: string };
    if (errorWithCode.code) {
      code = errorWithCode.code;
    }
  } else if (typeof error === "string") {
    originalMessage = error;
  } else if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === "string") {
      originalMessage = errorObj.message;
    }
    if (typeof errorObj.code === "string") {
      code = errorObj.code;
    }
  }

  // Check if the message contains sensitive info
  const hasSensitiveInfo = containsSensitiveInfo(originalMessage);

  // If sensitive info detected, use generic message
  if (hasSensitiveInfo) {
    return {
      message: getGenericMessage(code),
      code,
      safe: true,
    };
  }

  // Check message length - very long messages might contain stack traces
  if (originalMessage.length > 200) {
    return {
      message: getGenericMessage(code),
      code,
      safe: true,
    };
  }

  // Check for common sensitive phrases
  const lowerMessage = originalMessage.toLowerCase();
  const sensitiveKeywords = [
    "internal",
    "stack",
    "trace",
    "file:",
    "line:",
    "at module",
    "at async",
    "at object",
    "node_modules",
    "webpack",
    "prisma",
    "database",
    "connection refused",
    "econnrefused",
    "etimedout",
  ];

  for (const keyword of sensitiveKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        message: getGenericMessage(code),
        code,
        safe: true,
      };
    }
  }

  // Message appears safe - redact any remaining patterns just in case
  return {
    message: redactSensitiveInfo(originalMessage),
    code,
    safe: !hasSensitiveInfo,
  };
}

/**
 * Create a safe API error response
 */
export function createSafeErrorResponse(
  error: unknown,
  defaultCode: string = "SERVER_ERROR"
): {
  success: false;
  error: {
    message: string;
    code: string;
  };
} {
  const sanitized = sanitizeError(error, defaultCode);
  
  return {
    success: false,
    error: {
      message: sanitized.message,
      code: sanitized.code,
    },
  };
}

/**
 * Log error details server-side (safe for console.error)
 * Also captures to Sentry if configured
 */
export function logServerError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  // Only log in server environment
  if (typeof window !== "undefined") {
    return;
  }

  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const errorInfo = {
    timestamp,
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };

  // Log to console
  console.error("[Server Error]", JSON.stringify(errorInfo, null, 2));

  // Capture to Sentry if configured
  captureToSentry(error, context);
}

/**
 * Capture an error to Sentry with sanitized context
 * Ensures sensitive data is redacted before sending
 */
export function captureToSentry(
  error: unknown,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "error"
): void {
  // Only capture if Sentry is configured
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  try {
    // Sanitize context to remove sensitive data
    const sanitizedContext = context ? sanitizeContext(context) : undefined;

    // Capture the error
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level,
        extra: sanitizedContext,
        tags: {
          errorType: error.name,
          environment: process.env.NODE_ENV || "unknown",
        },
      });
    } else {
      // For non-Error objects, capture as a message
      const message = typeof error === "string" ? error : JSON.stringify(error);
      Sentry.captureMessage(redactSensitiveInfo(message), {
        level,
        extra: sanitizedContext,
      });
    }
  } catch (sentryError) {
    // Don't let Sentry errors break the application
    console.error("[Sentry] Failed to capture error:", sentryError);
  }
}

/**
 * Add a breadcrumb to Sentry for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
): void {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  try {
    Sentry.addBreadcrumb({
      message: redactSensitiveInfo(message),
      category,
      level,
      data: data ? sanitizeContext(data) : undefined,
    });
  } catch {
    // Ignore breadcrumb errors
  }
}

/**
 * Set user context for Sentry (for tracking user-specific errors)
 * Only sets non-sensitive user info
 */
export function setSentryUser(userId: string, email?: string): void {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  try {
    Sentry.setUser({
      id: userId,
      // Only include email if it's not in a sensitive pattern
      email: email && !containsSensitiveInfo(email) ? email : undefined,
    });
  } catch {
    // Ignore user context errors
  }
}

/**
 * Clear user context from Sentry (on logout)
 */
export function clearSentryUser(): void {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  try {
    Sentry.setUser(null);
  } catch {
    // Ignore
  }
}

/**
 * Sanitize a context object by redacting sensitive values
 */
function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "apiKey",
    "api_key",
    "accessToken",
    "access_token",
    "refreshToken",
    "refresh_token",
  ];

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    
    // Check if the key itself is sensitive
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Sanitize string values
    if (typeof value === "string") {
      sanitized[key] = redactSensitiveInfo(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Wrap an async handler with error sanitization
 */
export function withSafeErrors<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  defaultCode: string = "SERVER_ERROR"
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      logServerError(error, { handler: handler.name });
      throw new Error(getGenericMessage(defaultCode));
    }
  }) as T;
}
