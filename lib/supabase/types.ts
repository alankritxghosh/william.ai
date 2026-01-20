/**
 * Supabase Database Types
 * 
 * TypeScript types for the database schema.
 * These provide type safety for all database operations.
 * 
 * NOTE: In a production setup, you would generate these types
 * automatically using the Supabase CLI:
 * 
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
 * 
 * The types below are manually created to match our schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Database schema types matching our migrations
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          total_posts_generated: number;
          total_api_cost_usd: number;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          total_posts_generated?: number;
          total_api_cost_usd?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          total_posts_generated?: number;
          total_api_cost_usd?: number;
        };
        Relationships: [];
      };
      voice_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          rules: VoiceRulesJson;
          top_posts: TopPostJson[];
          brand_colors: BrandColorsJson;
          stats: VoiceProfileStatsJson | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          rules: VoiceRulesJson;
          top_posts?: TopPostJson[];
          brand_colors?: BrandColorsJson;
          stats?: VoiceProfileStatsJson | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          rules?: VoiceRulesJson;
          top_posts?: TopPostJson[];
          brand_colors?: BrandColorsJson;
          stats?: VoiceProfileStatsJson | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      generated_posts: {
        Row: {
          id: string;
          user_id: string;
          voice_profile_id: string;
          interview_data: InterviewDataJson;
          pipeline_data: PipelineDataJson;
          outputs: OutputsJson;
          quality_score: number;
          tokens_used: number;
          api_cost_usd: number;
          status: PostStatus;
          failure_reason: string | null;
          exported_at: string | null;
          scheduled_for: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          voice_profile_id: string;
          interview_data: InterviewDataJson;
          pipeline_data: PipelineDataJson;
          outputs: OutputsJson;
          quality_score: number;
          tokens_used?: number;
          api_cost_usd?: number;
          status?: PostStatus;
          failure_reason?: string | null;
          exported_at?: string | null;
          scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          voice_profile_id?: string;
          interview_data?: InterviewDataJson;
          pipeline_data?: PipelineDataJson;
          outputs?: OutputsJson;
          quality_score?: number;
          tokens_used?: number;
          api_cost_usd?: number;
          status?: PostStatus;
          failure_reason?: string | null;
          exported_at?: string | null;
          scheduled_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_posts_voice_profile_id_fkey";
            columns: ["voice_profile_id"];
            referencedRelation: "voice_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// ============================================================================
// JSON COLUMN TYPES
// These match the JSONB structures in our database
// ============================================================================

/**
 * Voice rules structure
 */
export interface VoiceRulesJson {
  sentencePatterns: string[];
  forbiddenWords: string[];
  signaturePhrases: string[];
  rhythmPreferences: {
    avgSentenceLength: number;
    paragraphBreaks: "frequent" | "moderate" | "rare";
    punchlinePosition: "end" | "middle" | "start";
    questionUsage: "never" | "occasional" | "frequent";
  };
  formattingRules: {
    useEmDash: boolean;
    useBulletPoints: boolean;
    useNumberedLists: boolean;
    emojiUsage: "never" | "rare" | "moderate" | "frequent";
  };
}

/**
 * Top post reference structure
 */
export interface TopPostJson {
  content: string;
  platform: "linkedin" | "twitter";
  engagement: number;
  url?: string;
}

/**
 * Brand colors structure
 */
export interface BrandColorsJson {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Voice profile stats structure
 */
export interface VoiceProfileStatsJson {
  totalPosts: number;
  avgQualityScore: number;
  lastUsed: string;
}

/**
 * Interview data structure
 */
export interface InterviewDataJson {
  id: string;
  flowType: "experience" | "pattern";
  voiceModeId: string;
  voiceProfileId: string;
  createdAt: string;
  answers: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
    q6?: string;
  };
  extractedInsight?: string;
  platform: "linkedin" | "twitter" | "both";
  targetAudience?: string;
}

/**
 * Generation pipeline data structure
 */
export interface PipelineDataJson {
  initialVersions: string[];
  selectedVersion: string;
  selectionReasoning: string;
  refinedVersion: string;
  refinementChanges: string[];
  hookOptions: string[];
  selectedHook: string;
  hookOptimizedVersion: string;
  personalityVersion: string;
  injectedElements: string[];
  finalVersion: string;
}

/**
 * Platform outputs structure
 */
export interface OutputsJson {
  linkedin: {
    post: string;
    characterCount: number;
    hashtagCount: number;
  };
  twitter: {
    thread: string[];
    characterCounts: number[];
  };
}

/**
 * Post status enum
 */
export type PostStatus = "generating" | "passed" | "failed" | "exported" | "scheduled";

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract row type from a table
 */
export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Extract insert type from a table
 */
export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Extract update type from a table
 */
export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience type aliases
export type Profile = TableRow<"profiles">;
export type ProfileInsert = TableInsert<"profiles">;
export type ProfileUpdate = TableUpdate<"profiles">;

export type VoiceProfile = TableRow<"voice_profiles">;
export type VoiceProfileInsert = TableInsert<"voice_profiles">;
export type VoiceProfileUpdate = TableUpdate<"voice_profiles">;

export type GeneratedPost = TableRow<"generated_posts">;
export type GeneratedPostInsert = TableInsert<"generated_posts">;
export type GeneratedPostUpdate = TableUpdate<"generated_posts">;
