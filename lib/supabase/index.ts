/**
 * Supabase Client Exports
 * 
 * Centralized exports for all Supabase utilities.
 * Import from '@/lib/supabase' for convenience.
 */

// Browser client (use in client components)
export { createClient, getClient } from "./client";

// Server clients (use in server components, API routes, server actions)
export {
  createClient as createServerClient,
  createRouteHandlerClient,
  createAdminClient,
  getAuthenticatedUser,
  requireAuth,
} from "./server";

// Middleware utilities
export {
  updateSession,
  isProtectedRoute,
  isAuthRoute,
  isPublicRoute,
  getLoginUrl,
  createUnauthorizedResponse,
} from "./middleware";

// Auth actions (server-side)
export {
  signOut,
  signOutNoRedirect,
  requestPasswordReset,
  updatePassword,
  updateEmail,
  getCurrentProfile,
  deleteAccount,
  resendVerificationEmail,
} from "./auth-actions";

// API route auth helpers
export {
  authenticateRequest,
  createErrorResponse,
  createSuccessResponse,
  getUserRateLimitKey,
  verifyResourceOwnership,
  withAuth,
  sanitizeUserForResponse,
  type APIResponse,
  type APIErrorResponse,
  type APISuccessResponse,
} from "./api-auth";

// Database operations
export {
  // Voice profiles
  fetchVoiceProfiles,
  fetchVoiceProfile,
  createVoiceProfile,
  updateVoiceProfile,
  deleteVoiceProfile,
  // Generated posts
  fetchGeneratedPosts,
  createGeneratedPost,
  updateGeneratedPost,
  deleteGeneratedPost,
  // User stats
  incrementUserStats,
  // Type converters
  dbToAppVoiceProfile,
  appToDbVoiceProfile,
  dbToAppGeneratedPost,
  appToDbGeneratedPost,
} from "./database";

// Database types
export type {
  Database,
  Json,
  // Table row types
  Profile,
  VoiceProfile,
  GeneratedPost,
  // Insert types
  ProfileInsert,
  VoiceProfileInsert,
  GeneratedPostInsert,
  // Update types
  ProfileUpdate,
  VoiceProfileUpdate,
  GeneratedPostUpdate,
  // JSON column types
  VoiceRulesJson,
  TopPostJson,
  BrandColorsJson,
  VoiceProfileStatsJson,
  InterviewDataJson,
  PipelineDataJson,
  OutputsJson,
  PostStatus,
  // Helper types
  TableRow,
  TableInsert,
  TableUpdate,
} from "./types";
