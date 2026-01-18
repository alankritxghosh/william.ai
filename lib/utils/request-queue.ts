/**
 * Request Queue for API Rate Limit Management
 * 
 * Implements a queue system to prevent hitting Gemini API rate limits
 * by controlling concurrent requests and adding delays between calls.
 * 
 * Gemini API Limits (Free Tier):
 * - 60 requests per minute
 * - 1,500 requests per day
 * 
 * This queue ensures we stay within limits even with concurrent users.
 */

import PQueue from "p-queue";

// ==========================================
// CONFIGURATION
// ==========================================

// Maximum concurrent requests to Gemini API
// With 6+ calls per generation, limit to 5 concurrent to stay safe
const MAX_CONCURRENT = 5;

// Minimum delay between requests (ms) to respect rate limits
// 60 req/min = 1 req/second, add buffer for safety
const INTERVAL_MS = 1000;

// Maximum requests per interval
const INTERVAL_CAP = 1;

// Queue timeout - requests waiting too long should fail gracefully
const QUEUE_TIMEOUT_MS = 120000; // 2 minutes

// ==========================================
// QUEUE INSTANCES
// ==========================================

/**
 * Main API request queue
 * Controls concurrency and rate limiting for all Gemini API calls
 */
export const apiQueue = new PQueue({
  concurrency: MAX_CONCURRENT,
  interval: INTERVAL_MS,
  intervalCap: INTERVAL_CAP,
});

/**
 * High priority queue for single-shot requests (like insight extraction)
 * Slightly higher priority than generation pipeline calls
 */
export const priorityQueue = new PQueue({
  concurrency: 2,
  interval: 500,
  intervalCap: 1,
});

// ==========================================
// QUEUE UTILITIES
// ==========================================

export interface QueueStats {
  pending: number;
  size: number;
  isPaused: boolean;
  concurrency: number;
}

/**
 * Get current queue statistics
 */
export function getQueueStats(): QueueStats {
  return {
    pending: apiQueue.pending,
    size: apiQueue.size,
    isPaused: apiQueue.isPaused,
    concurrency: MAX_CONCURRENT,
  };
}

/**
 * Pause the queue (for emergency rate limit situations)
 */
export function pauseQueue(): void {
  apiQueue.pause();
  priorityQueue.pause();
  console.warn("[Queue] API queues paused");
}

/**
 * Resume the queue
 */
export function resumeQueue(): void {
  apiQueue.start();
  priorityQueue.start();
  console.log("[Queue] API queues resumed");
}

/**
 * Clear all pending requests (use with caution)
 */
export function clearQueue(): void {
  apiQueue.clear();
  priorityQueue.clear();
  console.warn("[Queue] All pending requests cleared");
}

/**
 * Add a request to the queue
 * Returns a promise that resolves when the request completes
 */
export async function enqueue<T>(
  fn: () => Promise<T>,
  priority: "normal" | "high" = "normal"
): Promise<T> {
  const queue = priority === "high" ? priorityQueue : apiQueue;
  
  // Log queue status in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Queue] Adding request. Pending: ${queue.pending}, Size: ${queue.size}`);
  }
  
  try {
    // Add timeout wrapper for queue timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(
        () => reject(new Error("Request timed out waiting in queue. Please try again.")), 
        QUEUE_TIMEOUT_MS
      )
    );
    
    const result = await Promise.race([
      queue.add(fn),
      timeoutPromise,
    ]);
    return result as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      throw error;
    }
    throw error;
  }
}

/**
 * Wait for the queue to be empty
 * Useful for graceful shutdown or testing
 */
export async function waitForQueueEmpty(): Promise<void> {
  await Promise.all([
    apiQueue.onIdle(),
    priorityQueue.onIdle(),
  ]);
}

/**
 * Check if the queue is healthy (not backed up)
 */
export function isQueueHealthy(): boolean {
  // If more than 20 requests are waiting, queue is backing up
  const totalPending = apiQueue.pending + priorityQueue.pending;
  return totalPending < 20;
}

/**
 * Get estimated wait time based on current queue size
 */
export function getEstimatedWaitTime(): number {
  const totalSize = apiQueue.size + priorityQueue.size;
  // Each request takes approximately INTERVAL_MS to process
  return totalSize * INTERVAL_MS;
}
