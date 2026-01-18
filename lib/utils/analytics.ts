/**
 * Custom Analytics Events for William.ai
 * 
 * Tracks key user actions for product analytics and optimization.
 * Uses Vercel Analytics under the hood.
 */

import { track } from "@vercel/analytics";

// Event Types
export type AnalyticsEvent = 
  | "profile_created"
  | "profile_edited"
  | "profile_deleted"
  | "post_generated"
  | "post_exported"
  | "post_copied"
  | "carousel_created"
  | "carousel_downloaded"
  | "interview_started"
  | "interview_completed"
  | "insight_extracted"
  | "quality_score_achieved"
  | "generation_retry"
  | "error_occurred";

// Event Properties
export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a custom analytics event
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  try {
    // Only track in production
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Analytics] ${event}`, properties);
      return;
    }

    track(event, properties);
  } catch (error) {
    console.error("Analytics tracking error:", error);
  }
}

// Convenience functions for common events

/**
 * Track profile creation
 */
export function trackProfileCreated(profileId: string, rulesCount: number): void {
  trackEvent("profile_created", {
    profileId,
    rulesCount,
  });
}

/**
 * Track post generation
 */
export function trackPostGenerated(
  profileId: string,
  flowType: "experience" | "pattern",
  qualityScore: number,
  voiceMode: string
): void {
  trackEvent("post_generated", {
    profileId,
    flowType,
    qualityScore,
    voiceMode,
  });
}

/**
 * Track post export
 */
export function trackPostExported(format: "csv" | "json" | "copy", platform: "linkedin" | "twitter"): void {
  trackEvent("post_exported", {
    format,
    platform,
  });
}

/**
 * Track carousel creation
 */
export function trackCarouselCreated(templateId: string, pageCount: number): void {
  trackEvent("carousel_created", {
    templateId,
    pageCount,
  });
}

/**
 * Track interview flow
 */
export function trackInterviewStarted(flowType: "experience" | "pattern"): void {
  trackEvent("interview_started", {
    flowType,
  });
}

export function trackInterviewCompleted(flowType: "experience" | "pattern", duration: number): void {
  trackEvent("interview_completed", {
    flowType,
    durationSeconds: Math.round(duration / 1000),
  });
}

/**
 * Track quality achievements
 */
export function trackQualityScore(score: number, passed: boolean): void {
  trackEvent("quality_score_achieved", {
    score,
    passed,
    tier: score >= 95 ? "gold" : score >= 90 ? "excellent" : score >= 85 ? "good" : "needs_work",
  });
}

/**
 * Track errors for monitoring
 */
export function trackError(errorType: string, message: string, recoverable: boolean): void {
  trackEvent("error_occurred", {
    errorType,
    message: message.slice(0, 100), // Limit message length
    recoverable,
  });
}

/**
 * Track generation retry
 */
export function trackGenerationRetry(attempt: number, reason: string): void {
  trackEvent("generation_retry", {
    attempt,
    reason,
  });
}
