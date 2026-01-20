/**
 * Supabase Database Operations
 * 
 * Type-safe database operations for voice profiles and generated posts.
 * All operations respect RLS - users can only access their own data.
 * 
 * SECURITY NOTES:
 * - All queries filtered by user_id (even with RLS as defense in depth)
 * - Uses parameterized queries (Supabase handles this)
 * - No raw SQL - only Supabase query builder
 */

import { createClient } from "./client";
import type {
  VoiceProfile as DbVoiceProfile,
  VoiceProfileInsert,
  VoiceProfileUpdate,
  GeneratedPost as DbGeneratedPost,
  GeneratedPostInsert,
  GeneratedPostUpdate,
  VoiceRulesJson,
  TopPostJson,
  BrandColorsJson,
  VoiceProfileStatsJson,
  InterviewDataJson,
  PipelineDataJson,
  OutputsJson,
} from "./types";
import type { VoiceProfile, GeneratedPost } from "@/lib/types";

// ============================================================================
// TYPE CONVERTERS
// Maps between application types and database types
// ============================================================================

/**
 * Convert database voice profile to application type
 */
export function dbToAppVoiceProfile(db: DbVoiceProfile): VoiceProfile {
  return {
    id: db.id,
    name: db.name,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    rules: db.rules as VoiceProfile["rules"],
    topPosts: db.top_posts as VoiceProfile["topPosts"],
    brandColors: db.brand_colors as VoiceProfile["brandColors"],
    stats: db.stats as VoiceProfile["stats"],
  };
}

/**
 * Convert application voice profile to database insert type
 */
export function appToDbVoiceProfile(
  app: Omit<VoiceProfile, "id" | "createdAt" | "updatedAt">,
  userId: string
): VoiceProfileInsert {
  return {
    user_id: userId,
    name: app.name,
    rules: app.rules as unknown as VoiceRulesJson,
    top_posts: app.topPosts as unknown as TopPostJson[],
    brand_colors: app.brandColors as unknown as BrandColorsJson,
    stats: app.stats as unknown as VoiceProfileStatsJson | null,
  };
}

/**
 * Convert database generated post to application type
 */
export function dbToAppGeneratedPost(
  db: DbGeneratedPost,
  voiceProfile: VoiceProfile
): GeneratedPost {
  return {
    id: db.id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    interviewData: db.interview_data as unknown as GeneratedPost["interviewData"],
    voiceProfileId: db.voice_profile_id,
    voiceProfile: voiceProfile,
    pipeline: db.pipeline_data as unknown as GeneratedPost["pipeline"],
    quality: {
      score: db.quality_score,
      similarityScore: 0, // Not stored in DB, computed at runtime
      specificityCount: 0,
      slopDetected: [],
      passedGates: db.status === "passed",
    },
    outputs: db.outputs as unknown as GeneratedPost["outputs"],
    status: db.status,
    failureReason: db.failure_reason || undefined,
    exportedAt: db.exported_at || undefined,
    scheduledFor: db.scheduled_for || undefined,
  };
}

/**
 * Convert application generated post to database insert type
 */
export function appToDbGeneratedPost(
  app: GeneratedPost,
  userId: string
): GeneratedPostInsert {
  return {
    id: app.id,
    user_id: userId,
    voice_profile_id: app.voiceProfileId,
    interview_data: app.interviewData as unknown as InterviewDataJson,
    pipeline_data: app.pipeline as unknown as PipelineDataJson,
    outputs: app.outputs as unknown as OutputsJson,
    quality_score: app.quality.score,
    tokens_used: 0, // Can be updated later
    api_cost_usd: 0, // Can be updated later
    status: app.status,
    failure_reason: app.failureReason || null,
    exported_at: app.exportedAt || null,
    scheduled_for: app.scheduledFor || null,
  };
}

// ============================================================================
// VOICE PROFILE OPERATIONS
// ============================================================================

/**
 * Fetch all voice profiles for the current user
 */
export async function fetchVoiceProfiles(): Promise<{
  data: VoiceProfile[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: null }; // Not authenticated, return empty
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[DB] Fetch voice profiles error:", error.message);
      return { data: [], error: error.message };
    }

    return {
      data: (data || []).map(dbToAppVoiceProfile),
      error: null,
    };
  } catch (err) {
    console.error("[DB] Fetch voice profiles exception:", err);
    return { data: [], error: "Failed to fetch voice profiles" };
  }
}

/**
 * Fetch a single voice profile by ID
 */
export async function fetchVoiceProfile(id: string): Promise<{
  data: VoiceProfile | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id) // Defense in depth
      .single();

    if (error) {
      console.error("[DB] Fetch voice profile error:", error.message);
      return { data: null, error: error.message };
    }

    return {
      data: data ? dbToAppVoiceProfile(data) : null,
      error: null,
    };
  } catch (err) {
    console.error("[DB] Fetch voice profile exception:", err);
    return { data: null, error: "Failed to fetch voice profile" };
  }
}

/**
 * Create a new voice profile
 */
export async function createVoiceProfile(
  profile: Omit<VoiceProfile, "id" | "createdAt" | "updatedAt">
): Promise<{
  data: VoiceProfile | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const dbProfile = appToDbVoiceProfile(profile, user.id);

    const { data, error } = await supabase
      .from("voice_profiles")
      .insert(dbProfile)
      .select()
      .single();

    if (error) {
      console.error("[DB] Create voice profile error:", error.message);
      return { data: null, error: error.message };
    }

    return {
      data: data ? dbToAppVoiceProfile(data) : null,
      error: null,
    };
  } catch (err) {
    console.error("[DB] Create voice profile exception:", err);
    return { data: null, error: "Failed to create voice profile" };
  }
}

/**
 * Update a voice profile
 */
export async function updateVoiceProfile(
  id: string,
  updates: Partial<Omit<VoiceProfile, "id" | "createdAt" | "updatedAt">>
): Promise<{
  data: VoiceProfile | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const dbUpdates: VoiceProfileUpdate = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.rules !== undefined) dbUpdates.rules = updates.rules as unknown as VoiceRulesJson;
    if (updates.topPosts !== undefined) dbUpdates.top_posts = updates.topPosts as unknown as TopPostJson[];
    if (updates.brandColors !== undefined) dbUpdates.brand_colors = updates.brandColors as unknown as BrandColorsJson;
    if (updates.stats !== undefined) dbUpdates.stats = updates.stats as unknown as VoiceProfileStatsJson | null;

    const { data, error } = await supabase
      .from("voice_profiles")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", user.id) // Defense in depth
      .select()
      .single();

    if (error) {
      console.error("[DB] Update voice profile error:", error.message);
      return { data: null, error: error.message };
    }

    return {
      data: data ? dbToAppVoiceProfile(data) : null,
      error: null,
    };
  } catch (err) {
    console.error("[DB] Update voice profile exception:", err);
    return { data: null, error: "Failed to update voice profile" };
  }
}

/**
 * Delete a voice profile
 */
export async function deleteVoiceProfile(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("voice_profiles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Defense in depth

    if (error) {
      console.error("[DB] Delete voice profile error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("[DB] Delete voice profile exception:", err);
    return { success: false, error: "Failed to delete voice profile" };
  }
}

// ============================================================================
// GENERATED POSTS OPERATIONS
// ============================================================================

/**
 * Fetch all generated posts for the current user
 */
export async function fetchGeneratedPosts(
  voiceProfiles: VoiceProfile[]
): Promise<{
  data: GeneratedPost[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("generated_posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[DB] Fetch generated posts error:", error.message);
      return { data: [], error: error.message };
    }

    // Map posts with their voice profiles
    const profileMap = new Map(voiceProfiles.map((p) => [p.id, p]));
    const posts = (data || [])
      .map((post) => {
        const profile = profileMap.get(post.voice_profile_id);
        if (!profile) return null; // Voice profile deleted
        return dbToAppGeneratedPost(post, profile);
      })
      .filter((p): p is GeneratedPost => p !== null);

    return { data: posts, error: null };
  } catch (err) {
    console.error("[DB] Fetch generated posts exception:", err);
    return { data: [], error: "Failed to fetch posts" };
  }
}

/**
 * Create a new generated post
 */
export async function createGeneratedPost(
  post: GeneratedPost
): Promise<{
  data: GeneratedPost | null;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const dbPost = appToDbGeneratedPost(post, user.id);

    const { data, error } = await supabase
      .from("generated_posts")
      .insert(dbPost)
      .select()
      .single();

    if (error) {
      console.error("[DB] Create generated post error:", error.message);
      return { data: null, error: error.message };
    }

    // Return with the original voice profile
    return {
      data: data ? dbToAppGeneratedPost(data, post.voiceProfile) : null,
      error: null,
    };
  } catch (err) {
    console.error("[DB] Create generated post exception:", err);
    return { data: null, error: "Failed to create post" };
  }
}

/**
 * Update a generated post
 */
export async function updateGeneratedPost(
  id: string,
  updates: Partial<Pick<GeneratedPost, "status" | "exportedAt" | "scheduledFor" | "failureReason">>
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUpdates: GeneratedPostUpdate = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.exportedAt !== undefined) dbUpdates.exported_at = updates.exportedAt;
    if (updates.scheduledFor !== undefined) dbUpdates.scheduled_for = updates.scheduledFor;
    if (updates.failureReason !== undefined) dbUpdates.failure_reason = updates.failureReason;

    const { error } = await supabase
      .from("generated_posts")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[DB] Update generated post error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("[DB] Update generated post exception:", err);
    return { success: false, error: "Failed to update post" };
  }
}

/**
 * Delete a generated post
 */
export async function deleteGeneratedPost(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("generated_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[DB] Delete generated post error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("[DB] Delete generated post exception:", err);
    return { success: false, error: "Failed to delete post" };
  }
}

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

/**
 * Update user stats after generating a post
 */
export async function incrementUserStats(
  tokensUsed: number,
  apiCost: number
): Promise<void> {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_posts_generated, total_api_cost_usd")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          total_posts_generated: profile.total_posts_generated + 1,
          total_api_cost_usd: profile.total_api_cost_usd + apiCost,
        })
        .eq("id", user.id);
    }
  } catch (err) {
    console.error("[DB] Increment user stats error:", err);
  }
}
