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
 * Returns null if not configured (for build-time compatibility)
 */
function getSupabaseConfig(): { supabaseUrl: string; supabaseAnonKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build or if not configured, return null
    // The calling code should handle this gracefully
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Create a Supabase client for browser use
 * 
 * Usage in Client Components:
 * 
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export function MyComponent() {
 *   const supabase = createClient();
 *   // Use supabase client...
 * }
 */
export function createClient() {
  const config = getSupabaseConfig();
  
  if (!config) {
    // Return a mock client that throws helpful errors when used
    // This allows the app to build but will fail at runtime if used
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  // createBrowserClient automatically handles cookies
  return createBrowserClient<Database>(config.supabaseUrl, config.supabaseAnonKey);
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
