/**
 * Sentry Edge Runtime Configuration
 * 
 * This file configures Sentry for edge runtime (middleware, edge API routes).
 * Edge runtime has limited APIs compared to Node.js, so this config is minimal.
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
    // Lower sample rate for edge to reduce overhead
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Remove any potential API keys from messages
      if (event.message) {
        event.message = event.message
          .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, "[REDACTED]")
          .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");
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

    // Ignore common edge errors
    ignoreErrors: [
      "Rate limit exceeded",
      "Unauthorized",
    ],

    // Only enable in production
    enabled: process.env.NODE_ENV === "production",
  });
}
