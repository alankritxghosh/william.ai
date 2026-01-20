/**
 * Health Check Endpoint
 * 
 * Provides system status for monitoring and alerting.
 * Returns sanitized status information (no secrets).
 * 
 * SECURITY: This is a PUBLIC endpoint (no auth required)
 * - Does not expose any sensitive information
 * - Does not expose user data
 * - Only returns service status
 * 
 * Usage:
 * - Vercel health checks
 * - Uptime monitoring (e.g., UptimeRobot, Pingdom)
 * - Debugging deployment issues
 */

import { NextResponse } from "next/server";
import { isGeminiConfigured, getUsageMetrics } from "@/lib/gemini";
import { isRedisRateLimitEnabled } from "@/lib/utils/rate-limiter";
import { getQueueStats, isQueueHealthy } from "@/lib/utils/request-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    gemini: ServiceStatus;
    redis: ServiceStatus;
    queue: ServiceStatus;
    supabase: ServiceStatus;
  };
  metrics?: {
    queue: {
      pending: number;
      size: number;
      healthy: boolean;
    };
    usage: {
      requestCount: number;
      estimatedCost: string;
    };
  };
}

interface ServiceStatus {
  status: "ok" | "degraded" | "error" | "not_configured";
  message: string;
}

// Track server start time
const serverStartTime = Date.now();

export async function GET(request: Request): Promise<NextResponse<HealthStatus>> {
  const services = {
    gemini: checkGeminiStatus(),
    redis: checkRedisStatus(),
    queue: checkQueueStatus(),
    supabase: checkSupabaseStatus(),
  };

  // Determine overall status
  const statuses = Object.values(services).map((s) => s.status);
  let overallStatus: HealthStatus["status"] = "healthy";

  if (statuses.includes("error")) {
    overallStatus = "unhealthy";
  } else if (statuses.includes("degraded") || statuses.includes("not_configured")) {
    overallStatus = "degraded";
  }

  // Get metrics (only include in response if not production or if explicitly requested)
  const includeMetrics = 
    process.env.NODE_ENV !== "production" || 
    request.headers.get("x-include-metrics") === "true";

  const queueStats = getQueueStats();
  const usageMetrics = getUsageMetrics();

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    services,
  };

  // Include detailed metrics if requested
  if (includeMetrics) {
    response.metrics = {
      queue: {
        pending: queueStats.pending,
        size: queueStats.size,
        healthy: isQueueHealthy(),
      },
      usage: {
        requestCount: usageMetrics.requestCount,
        estimatedCost: `$${usageMetrics.estimatedCost.toFixed(4)}`,
      },
    };
  }

  // Return 200 for healthy/degraded, 503 for unhealthy
  const statusCode = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Health-Status": overallStatus,
    },
  });
}

/**
 * Check Gemini API configuration status
 */
function checkGeminiStatus(): ServiceStatus {
  if (!isGeminiConfigured()) {
    return {
      status: "error",
      message: "GEMINI_API_KEY not configured",
    };
  }

  return {
    status: "ok",
    message: "API key configured",
  };
}

/**
 * Check Redis rate limiter status
 */
function checkRedisStatus(): ServiceStatus {
  if (!isRedisRateLimitEnabled()) {
    // In production, this is a degraded state
    if (process.env.NODE_ENV === "production") {
      return {
        status: "degraded",
        message: "Redis not configured - using in-memory fallback (not recommended for production)",
      };
    }
    return {
      status: "not_configured",
      message: "Using in-memory rate limiter (OK for development)",
    };
  }

  return {
    status: "ok",
    message: "Upstash Redis connected",
  };
}

/**
 * Check request queue status
 */
function checkQueueStatus(): ServiceStatus {
  const stats = getQueueStats();
  const healthy = isQueueHealthy();

  if (!healthy) {
    return {
      status: "degraded",
      message: `Queue backing up: ${stats.pending} pending, ${stats.size} waiting`,
    };
  }

  if (stats.isPaused) {
    return {
      status: "error",
      message: "Queue is paused",
    };
  }

  return {
    status: "ok",
    message: `Healthy: ${stats.pending} pending, ${stats.size} waiting`,
  };
}

/**
 * Check Supabase configuration status
 */
function checkSupabaseStatus(): ServiceStatus {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
    return {
      status: "error",
      message: "Supabase not configured (missing URL or anon key)",
    };
  }

  if (!hasServiceRoleKey) {
    // Service role key is optional but recommended
    if (process.env.NODE_ENV === "production") {
      return {
        status: "degraded",
        message: "Service role key not configured (some admin features unavailable)",
      };
    }
  }

  return {
    status: "ok",
    message: "Supabase configured",
  };
}
