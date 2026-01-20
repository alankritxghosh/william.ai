/**
 * Supabase Server Client
 * 
 * Creates Supabase clients for use in Server Components, API Routes,
 * and Server Actions. Properly handles cookies for session management.
 * 
 * SECURITY NOTES:
 * - Uses ANON key by default (RLS enforced)
 * - Service role client available for admin operations (bypasses RLS)
 * - NEVER expose service role key to client
 * - All server clients validate session on each request
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Environment variable validation
 */
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Create a Supabase client for Server Components
 * 
 * This client is read-only for cookies (can't set new cookies in Server Components)
 * Use for fetching data in page.tsx, layout.tsx, etc.
 * 
 * Usage:
 * ```tsx
 * // In a Server Component (page.tsx, layout.tsx)
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   // ...
 * }
 * ```
 */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Create a Supabase client for API Routes (Route Handlers)
 * 
 * This client can read and write cookies, suitable for auth operations.
 * 
 * Usage in an API route (app/api/[endpoint]/route.ts):
 * 
 * import { createRouteHandlerClient } from '@/lib/supabase/server';
 * 
 * export async function POST(request: Request) {
 *   const supabase = await createRouteHandlerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) {
 *     return Response.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 * }
 */
export async function createRouteHandlerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * Create a Supabase Admin client (SERVICE ROLE)
 * 
 * ⚠️ SECURITY WARNING:
 * - This client BYPASSES Row Level Security
 * - NEVER use in client-side code
 * - NEVER expose SUPABASE_SERVICE_ROLE_KEY
 * - Only use for admin operations that require bypassing RLS
 * 
 * Usage:
 * ```tsx
 * // ONLY in server-side code (API routes, server actions)
 * import { createAdminClient } from '@/lib/supabase/server';
 * 
 * // Use sparingly - most operations should use regular client with RLS
 * const adminSupabase = createAdminClient();
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabaseServiceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "This key is required for admin operations."
    );
  }

  // Import createClient from @supabase/supabase-js for service role
  // (doesn't need cookie handling as it bypasses auth)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Disable auto-refresh for service role
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as ReturnType<typeof createServerClient<Database>>;
}

/**
 * Get the current authenticated user from a server context
 * 
 * Returns null if not authenticated. Use this for auth checks.
 * 
 * SECURITY NOTE: Always use getUser() instead of getSession() for
 * auth verification. getSession() only decodes the JWT locally,
 * while getUser() validates with Supabase servers.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  
  // IMPORTANT: Use getUser(), not getSession()
  // getUser() makes a request to Supabase to validate the JWT
  // getSession() only decodes locally and can be spoofed
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Require authentication - throws if not authenticated
 * 
 * Use this at the start of protected API routes or server actions.
 * 
 * Usage:
 * ```tsx
 * export async function POST(request: Request) {
 *   const user = await requireAuth();
 *   // user is guaranteed to be authenticated here
 * }
 * ```
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}
