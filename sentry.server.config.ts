/**
 * Sentry Server-Side Configuration
 * 
 * This file configures Sentry for server-side error tracking in Node.js.
 * It captures API route errors, server component errors, and performance data.
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is configured
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Remove any potential API keys or tokens from error messages
      if (event.message) {
        event.message = sanitizeServerMessage(event.message);
      }

      // Remove sensitive exception values
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map((exception) => {
          if (exception.value) {
            exception.value = sanitizeServerMessage(exception.value);
          }
          return exception;
        });
      }

      // Sanitize breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message) {
            breadcrumb.message = sanitizeServerMessage(breadcrumb.message);
          }
          // Remove sensitive data from breadcrumb data
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeBreadcrumbData(breadcrumb.data);
          }
          return breadcrumb;
        });
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
        for (const header of sensitiveHeaders) {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[REDACTED]";
          }
        }
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Rate limiting (expected behavior)
      "Rate limit exceeded",
      "Too many requests",
      // Network timeouts (user network issues)
      "ETIMEDOUT",
      "ECONNRESET",
      "ENOTFOUND",
    ],

    // Don't send events in development unless explicitly enabled
    enabled: process.env.NODE_ENV === "production" || 
             process.env.SENTRY_DEBUG === "true",
  });
}

/**
 * Remove sensitive patterns from server error messages
 */
function sanitizeServerMessage(message: string): string {
  return message
    // API keys
    .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, "[REDACTED_API_KEY]")
    .replace(/sk-[a-zA-Z0-9]{48}/g, "[REDACTED_SECRET]")
    // Environment variable patterns
    .replace(/process\.env\.[A-Z_]+\s*=\s*[^\s]+/g, "[REDACTED_ENV]")
    // Connection strings
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, "[REDACTED_MONGODB]")
    .replace(/postgres(ql)?:\/\/[^\s]+/gi, "[REDACTED_POSTGRES]")
    .replace(/redis:\/\/[^\s]+/gi, "[REDACTED_REDIS]")
    // Tokens and secrets
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/token[:\s]*[a-zA-Z0-9._-]+/gi, "token: [REDACTED]")
    .replace(/password[:\s]*[^\s]+/gi, "password: [REDACTED]")
    .replace(/secret[:\s]*[^\s]+/gi, "secret: [REDACTED]")
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // File paths
    .replace(/\/Users\/[^\s]+/g, "[REDACTED_PATH]")
    .replace(/\/home\/[^\s]+/g, "[REDACTED_PATH]")
    .replace(/C:\\Users\\[^\s]+/g, "[REDACTED_PATH]")
    // IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[REDACTED_IP]");
}

/**
 * Sanitize breadcrumb data object
 */
function sanitizeBreadcrumbData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "cookie"];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeServerMessage(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
