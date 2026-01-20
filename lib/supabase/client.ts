/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for use in browser/client components.
 * Uses cookies for session storage via @supabase/ssr.
 * 
 * SECURITY NOTES:
 * - This client uses the ANON key (safe to expose)
 * - RLS policies are enforced on all queries
 * - Sessions are stored in httpOnly cookies (set by server)
 * - Auto-refreshes tokens before expiry
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Environment variable validation
 * These are public keys, safe to expose in client bundle
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
      "Add it to your .env.local file."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
      "Add it to your .env.local file."
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Create a Supabase client for browser use
 * 
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export function MyComponent() {
 *   const supabase = createClient();
 *   // Use supabase client...
 * }
 * ```
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    // Cookie options for session storage
    cookies: {
      // Let @supabase/ssr handle cookie management automatically
    },
    // Auth configuration
    auth: {
      // Automatically refresh token before expiry
      autoRefreshToken: true,
      // Persist session across tabs
      persistSession: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Flow type for PKCE (more secure than implicit)
      flowType: "pkce",
    },
  });
}

/**
 * Singleton instance for consistent client usage
 * Use this when you need the same client instance across components
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
