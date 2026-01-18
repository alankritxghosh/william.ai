/**
 * Sentry Client-Side Configuration
 * 
 * This file configures Sentry for client-side error tracking in the browser.
 * It captures JavaScript errors, unhandled promise rejections, and performance data.
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay for debugging user issues
    // Capture 10% of sessions, 100% on errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Enable replay integration
    integrations: [
      Sentry.replayIntegration({
        // Mask all text and inputs for privacy
        maskAllText: true,
        maskAllInputs: true,
        // Block media elements to reduce payload
        blockAllMedia: true,
      }),
    ],

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Remove any potential API keys or tokens from error messages
      if (event.message) {
        event.message = sanitizeMessage(event.message);
      }

      // Sanitize breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message) {
            breadcrumb.message = sanitizeMessage(breadcrumb.message);
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      /^chrome-extension:/,
      /^moz-extension:/,
      // Network errors that user can't control
      "Network request failed",
      "Failed to fetch",
      "Load failed",
      // User navigation
      "ResizeObserver loop",
      // Third-party scripts
      /^Script error\.?$/,
    ],

    // Don't send events in development unless explicitly enabled
    enabled: process.env.NODE_ENV === "production" || 
             process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true",
  });
}

/**
 * Remove sensitive patterns from error messages
 */
function sanitizeMessage(message: string): string {
  return message
    // API keys
    .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, "[REDACTED_API_KEY]")
    .replace(/sk-[a-zA-Z0-9]{48}/g, "[REDACTED_SECRET]")
    // Tokens
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/token[:\s]*[a-zA-Z0-9._-]+/gi, "token: [REDACTED]")
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // File paths
    .replace(/\/Users\/[^\s]+/g, "[REDACTED_PATH]")
    .replace(/C:\\Users\\[^\s]+/g, "[REDACTED_PATH]");
}
