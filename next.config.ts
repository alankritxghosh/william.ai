import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Security Headers Configuration
 * 
 * These headers help protect against common web vulnerabilities:
 * - XSS attacks
 * - Clickjacking
 * - MIME type sniffing
 * - Information disclosure
 */
const securityHeaders = [
  {
    // Prevent clickjacking by disallowing embedding in iframes
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevent MIME type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Enable XSS filter in browsers (legacy, but still useful)
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    // Control referrer information sent with requests
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict browser features and APIs
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Content Security Policy
    // Production uses stricter settings, development allows unsafe-eval for HMR
    key: "Content-Security-Policy",
    value: process.env.NODE_ENV === "production"
      ? [
          "default-src 'self'",
          // Production: No unsafe-eval, only unsafe-inline for Next.js inline scripts
          "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://generativelanguage.googleapis.com https://vercel.live https://va.vercel-scripts.com wss://ws-us3.pusher.com",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
          "upgrade-insecure-requests",
        ].join("; ")
      : [
          // Development: Allow unsafe-eval for Next.js HMR and development features
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://generativelanguage.googleapis.com https://vercel.live https://va.vercel-scripts.com wss://ws-us3.pusher.com ws://localhost:* http://localhost:*",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "base-uri 'self'",
        ].join("; "),
  },
  {
    // Strict Transport Security (HTTPS only)
    // Only enable in production with valid HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Security headers for all routes
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: "/api/:path*",
        headers: [
          ...securityHeaders,
          {
            // Prevent caching of API responses with sensitive data
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },

  // Disable x-powered-by header (information disclosure)
  poweredByHeader: false,

  // Strict mode for React
  reactStrictMode: true,

};

// Sentry configuration options
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppress source map uploading logs during build
  silent: true,

  // Organization and project in Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map uploads
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps only in production builds
  // and only if auth token is configured
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from generated client bundles
  hideSourceMaps: true,

  // Tree-shake Sentry logger statements to reduce bundle size
  // Using the new webpack.treeshake config instead of deprecated disableLogger
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },

  // Tunnel Sentry events through your own server to avoid ad blockers
  // Uncomment if you set up a tunnel endpoint
  // tunnelRoute: "/monitoring",
};

// Wrap with Sentry only if DSN is configured
const finalConfig = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;

export default finalConfig;
