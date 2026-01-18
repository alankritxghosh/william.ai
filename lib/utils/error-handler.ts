/**
 * Centralized Error Handler for William.ai
 * 
 * Provides consistent error handling across the application with:
 * - Error classification
 * - User-friendly messages (sanitized for security)
 * - Logging for debugging (server-side only)
 * - Recovery suggestions
 */

import { 
  sanitizeError, 
  logServerError, 
  containsSensitiveInfo,
  captureToSentry,
  addSentryBreadcrumb,
} from "@/lib/security/error-sanitizer";

// Error Types
export enum ErrorType {
  NETWORK = "NETWORK",
  API = "API",
  VALIDATION = "VALIDATION",
  AUTH = "AUTH",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT = "RATE_LIMIT",
  STORAGE = "STORAGE",
  AI_GENERATION = "AI_GENERATION",
  UNKNOWN = "UNKNOWN",
}

// Structured Error
export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  suggestions: string[];
}

// Error messages mapping
const ERROR_MESSAGES: Record<ErrorType, { default: string; suggestions: string[] }> = {
  [ErrorType.NETWORK]: {
    default: "Unable to connect to the server. Please check your internet connection.",
    suggestions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Wait a moment and try again",
    ],
  },
  [ErrorType.API]: {
    default: "Something went wrong on our end. Please try again.",
    suggestions: [
      "Try the action again",
      "Refresh the page",
      "Contact support if the issue persists",
    ],
  },
  [ErrorType.VALIDATION]: {
    default: "Please check your input and try again.",
    suggestions: [
      "Review the form fields for errors",
      "Ensure all required fields are filled",
    ],
  },
  [ErrorType.AUTH]: {
    default: "Authentication required. Please sign in.",
    suggestions: [
      "Sign in to your account",
      "Check if your session has expired",
    ],
  },
  [ErrorType.NOT_FOUND]: {
    default: "The requested resource was not found.",
    suggestions: [
      "Check the URL",
      "Go back to the previous page",
      "Return to the dashboard",
    ],
  },
  [ErrorType.RATE_LIMIT]: {
    default: "Too many requests. Please wait a moment and try again.",
    suggestions: [
      "Wait 30 seconds before trying again",
      "Reduce the frequency of requests",
    ],
  },
  [ErrorType.STORAGE]: {
    default: "Failed to save data locally.",
    suggestions: [
      "Check if your browser allows local storage",
      "Clear some browser data if storage is full",
      "Try using a different browser",
    ],
  },
  [ErrorType.AI_GENERATION]: {
    default: "Failed to generate content. Please try again.",
    suggestions: [
      "Try with different input",
      "Simplify your request",
      "Check if your voice profile is complete",
    ],
  },
  [ErrorType.UNKNOWN]: {
    default: "An unexpected error occurred.",
    suggestions: [
      "Refresh the page",
      "Try again later",
      "Contact support if the issue persists",
    ],
  },
};

/**
 * Classify error type from various error sources
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return ErrorType.NETWORK;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
      return ErrorType.NETWORK;
    }
    if (message.includes("401") || message.includes("unauthorized") || message.includes("auth")) {
      return ErrorType.AUTH;
    }
    if (message.includes("404") || message.includes("not found")) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes("429") || message.includes("rate limit") || message.includes("too many")) {
      return ErrorType.RATE_LIMIT;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorType.VALIDATION;
    }
    if (message.includes("storage") || message.includes("quota")) {
      return ErrorType.STORAGE;
    }
    if (message.includes("generation") || message.includes("ai") || message.includes("gemini")) {
      return ErrorType.AI_GENERATION;
    }
    if (message.includes("500") || message.includes("server")) {
      return ErrorType.API;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Create a structured app error from any error
 * Sanitizes error messages to prevent information leakage
 */
export function createAppError(error: unknown, context?: string): AppError {
  const type = classifyError(error);
  const errorConfig = ERROR_MESSAGES[type];

  // Use the sanitizer to get safe error info
  const sanitized = sanitizeError(error, type);

  let message = sanitized.message;
  const code = sanitized.code;

  // Add context if provided (context is controlled by our code, so it's safe)
  if (context) {
    message = `${context}: ${message}`;
  }

  return {
    type,
    message, // This is now sanitized
    userMessage: errorConfig.default,
    code,
    recoverable: type !== ErrorType.AUTH && type !== ErrorType.NOT_FOUND,
    suggestions: errorConfig.suggestions,
  };
}

/**
 * Log error for debugging (sanitizes sensitive info before logging)
 * Also captures to Sentry with appropriate severity level
 */
export function logError(error: AppError, metadata?: Record<string, unknown>): void {
  // Determine Sentry severity level based on error type
  const sentryLevel = getSentrySeverityLevel(error.type);
  
  // Add a breadcrumb for error tracking
  addSentryBreadcrumb(
    `Error occurred: ${error.type}`,
    "error",
    { code: error.code, recoverable: error.recoverable },
    "error"
  );

  // Use the secure error logger for server-side
  if (typeof window === "undefined") {
    logServerError(error, {
      type: error.type,
      code: error.code,
      ...metadata,
    });
    return;
  }

  // Client-side: capture to Sentry
  captureToSentry(error, {
    type: error.type,
    code: error.code,
    recoverable: error.recoverable,
    ...metadata,
  }, sentryLevel);

  // Client-side logging (limited info in development)
  if (process.env.NODE_ENV === "development") {
    // Sanitize the message before logging even in development
    const safeMessage = containsSensitiveInfo(error.message) 
      ? error.userMessage 
      : error.message;
    
    console.error("[William.ai Error]", {
      type: error.type,
      message: safeMessage,
      code: error.code,
    });
  }
}

/**
 * Map error types to Sentry severity levels
 */
function getSentrySeverityLevel(errorType: ErrorType): "fatal" | "error" | "warning" | "info" {
  switch (errorType) {
    case ErrorType.AUTH:
    case ErrorType.NOT_FOUND:
      return "warning"; // Expected errors, not critical
    case ErrorType.RATE_LIMIT:
      return "info"; // Expected under load
    case ErrorType.NETWORK:
    case ErrorType.STORAGE:
    case ErrorType.VALIDATION:
      return "warning"; // User or environment issues
    case ErrorType.API:
    case ErrorType.AI_GENERATION:
      return "error"; // Our issues that need attention
    case ErrorType.UNKNOWN:
    default:
      return "error"; // Unknown errors need investigation
  }
}

/**
 * Handle API response errors
 */
export async function handleApiError(response: Response): Promise<AppError> {
  let errorMessage = `API Error: ${response.status} ${response.statusText}`;
  let errorCode: string | undefined;

  try {
    const data = await response.json();
    if (data.error?.message) {
      errorMessage = data.error.message;
      errorCode = data.error.code;
    }
  } catch {
    // Response might not be JSON
  }

  const type = 
    response.status === 401 ? ErrorType.AUTH :
    response.status === 404 ? ErrorType.NOT_FOUND :
    response.status === 429 ? ErrorType.RATE_LIMIT :
    response.status >= 500 ? ErrorType.API :
    ErrorType.UNKNOWN;

  return {
    type,
    message: errorMessage,
    userMessage: ERROR_MESSAGES[type].default,
    code: errorCode,
    recoverable: type !== ErrorType.AUTH && type !== ErrorType.NOT_FOUND,
    suggestions: ERROR_MESSAGES[type].suggestions,
  };
}

/**
 * Safe async wrapper that catches and handles errors
 */
export async function safeAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T, null] | [null, AppError]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const appError = createAppError(error, context);
    logError(appError, { context });
    return [null, appError];
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => error.recoverable,
  } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = createAppError(error);
      
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

/**
 * Get user-friendly error message for display
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  const appError = createAppError(error);
  return appError.userMessage;
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "userMessage" in error &&
    "recoverable" in error
  );
}
