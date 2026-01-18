/**
 * Rate Limiter for API Routes
 * 
 * Implements a sliding window rate limiter to prevent abuse
 * and protect the Gemini API key from excessive usage.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Maximum requests per window
  maxRequests: 10,
  // Window duration in milliseconds (1 minute)
  windowMs: 60 * 1000,
  // Clean up interval (5 minutes)
  cleanupIntervalMs: 5 * 60 * 1000,
};

// Cleanup old entries periodically
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs);
}

// Start cleanup on module load (server-side only)
if (typeof window === "undefined") {
  startCleanup();
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier (usually IP or user ID)
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
      reset: newEntry.resetTime,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return {
      success: false,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    success: true,
    limit: RATE_LIMIT_CONFIG.maxRequests,
    remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for IP identification
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  // Use the first available IP
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a hash of user-agent and other headers
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `ua-${hashString(userAgent)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
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
export function withRateLimit(request: Request): Response | null {
  const identifier = getClientIdentifier(request);
  const result = checkRateLimit(identifier);
  
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
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      reset: now + RATE_LIMIT_CONFIG.windowMs,
    };
  }
  
  return {
    success: entry.count < RATE_LIMIT_CONFIG.maxRequests,
    limit: RATE_LIMIT_CONFIG.maxRequests,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.count),
    reset: entry.resetTime,
  };
}
