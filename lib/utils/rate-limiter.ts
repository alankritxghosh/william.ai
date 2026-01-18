/**
 * Rate Limiter for API Routes
 * 
 * Implements a distributed rate limiter using Upstash Redis to prevent abuse
 * and protect the Gemini API key from excessive usage.
 * 
 * IMPORTANT: Redis is REQUIRED for production. In-memory fallback is only
 * for local development and provides no real protection in serverless.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis is configured
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN;

// CRITICAL: Require Redis in production
if (process.env.NODE_ENV === "production" && !isRedisConfigured) {
  console.error(
    "🚨 CRITICAL SECURITY WARNING: Upstash Redis is not configured!\n" +
    "Rate limiting will NOT work properly in production without Redis.\n" +
    "The in-memory fallback does not persist across serverless invocations.\n" +
    "Please configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
  );
}

// Initialize Redis client if configured
const redis = isRedisConfigured
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  // Maximum requests per window for unauthenticated users
  maxRequests: 10,
  // Window duration in seconds
  windowSeconds: 60,
  // Stricter limit for generation endpoint
  generateMaxRequests: 5,
  generateWindowSeconds: 60,
};

// Create rate limiter with Redis (distributed) or fallback to in-memory
const createRateLimiter = (maxRequests: number, windowSeconds: number) => {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
      prefix: "william_ratelimit",
    });
  }
  return null;
};

// Rate limiters for different endpoints
const generalRateLimiter = createRateLimiter(
  RATE_LIMIT_CONFIG.maxRequests,
  RATE_LIMIT_CONFIG.windowSeconds
);

const generateRateLimiter = createRateLimiter(
  RATE_LIMIT_CONFIG.generateMaxRequests,
  RATE_LIMIT_CONFIG.generateWindowSeconds
);

// Fallback in-memory store (for development without Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (only for in-memory fallback)
if (typeof window === "undefined" && !isRedisConfigured) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetTime < now) {
        inMemoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Clean every 5 minutes
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Get client identifier from request headers
 * Uses Vercel's trusted headers for accurate IP detection
 */
export function getClientIdentifier(request: Request): string {
  // Vercel provides the real IP in x-real-ip header (trusted)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Cloudflare's connecting IP (if using Cloudflare)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return `ip:${cfConnectingIp}`;
  }

  // x-forwarded-for can be spoofed, use only the rightmost IP (added by the proxy)
  // This is safer than using the leftmost which can be client-controlled
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map(ip => ip.trim());
    // Use the rightmost IP (closest to the server, added by trusted proxy)
    const proxyAddedIp = ips[ips.length - 1];
    if (proxyAddedIp) {
      return `ip:${proxyAddedIp}`;
    }
  }

  // Fallback to user-agent hash (less reliable but better than nothing)
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `ua:${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check rate limit using Redis or fallback to in-memory
 */
export async function checkRateLimit(
  identifier: string,
  type: "general" | "generate" = "general"
): Promise<RateLimitResult> {
  const rateLimiter = type === "generate" ? generateRateLimiter : generalRateLimiter;
  const config = type === "generate" 
    ? { max: RATE_LIMIT_CONFIG.generateMaxRequests, window: RATE_LIMIT_CONFIG.generateWindowSeconds }
    : { max: RATE_LIMIT_CONFIG.maxRequests, window: RATE_LIMIT_CONFIG.windowSeconds };

  // Use Redis rate limiter if available
  if (rateLimiter) {
    try {
      const result = await rateLimiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      console.error("Redis rate limit error, falling back to in-memory:", error);
      // Fall through to in-memory fallback
    }
  }

  // In-memory fallback
  return checkInMemoryRateLimit(identifier, config.max, config.window * 1000);
}

/**
 * In-memory rate limit check (fallback for development)
 */
function checkInMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    inMemoryStore.set(identifier, newEntry);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: newEntry.resetTime,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  entry.count++;
  inMemoryStore.set(identifier, entry);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Middleware-style rate limit check for API routes
 * Returns null if allowed, or Response if rate limited
 */
export async function withRateLimit(
  request: Request,
  type: "general" | "generate" = "general"
): Promise<Response | null> {
  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, type);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Too many requests. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: result.retryAfter,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...createRateLimitHeaders(result),
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit status without incrementing (for info purposes)
 */
export async function getRateLimitStatus(
  identifier: string,
  type: "general" | "generate" = "general"
): Promise<RateLimitResult> {
  // For Redis, we need to check without incrementing
  // For simplicity, we'll just return current status based on remaining
  // In production, you might want to use a separate read-only check
  const config = type === "generate"
    ? { max: RATE_LIMIT_CONFIG.generateMaxRequests, window: RATE_LIMIT_CONFIG.generateWindowSeconds }
    : { max: RATE_LIMIT_CONFIG.maxRequests, window: RATE_LIMIT_CONFIG.windowSeconds };

  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      reset: now + config.window * 1000,
    };
  }

  return {
    success: entry.count < config.max,
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Check if Redis is configured and available
 */
export function isRedisRateLimitEnabled(): boolean {
  return !!isRedisConfigured;
}
