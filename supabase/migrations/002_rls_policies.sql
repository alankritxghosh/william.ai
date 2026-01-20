-- ============================================================================
-- William.ai Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- 
-- SECURITY MODEL: Zero Trust - Users can ONLY access their own data
-- 
-- CRITICAL SECURITY NOTES:
-- - Every table has RLS enabled (no exceptions)
-- - Default policy is DENY ALL
-- - All policies use auth.uid() to identify the current user
-- - No admin bypasses or public access
-- - Service role key bypasses RLS (use only server-side!)
-- ============================================================================


-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- This MUST be done before creating policies
-- Once enabled, default is DENY ALL access (secure by default)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PROFILES TABLE POLICIES
-- 
-- Special case: profiles.id = auth.uid() (not user_id)
-- Users can only read/update their own profile
-- INSERT is handled by trigger (on_auth_user_created)
-- DELETE cascades from auth.users deletion
-- ============================================================================

-- SELECT: Users can only read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- INSERT: Users can only create their own profile
-- Note: Profile is auto-created by trigger, but allow manual creation if needed
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Users can only delete their own profile
-- Note: Typically handled by auth.users deletion cascade
CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());


-- ============================================================================
-- VOICE_PROFILES TABLE POLICIES
-- 
-- Standard pattern: user_id = auth.uid()
-- Users can CRUD only their own voice profiles
-- ============================================================================

-- SELECT: Users can only read their own voice profiles
CREATE POLICY "voice_profiles_select_own"
  ON public.voice_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Users can only create voice profiles for themselves
-- WITH CHECK ensures the user_id in the new row matches the authenticated user
CREATE POLICY "voice_profiles_insert_own"
  ON public.voice_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own voice profiles
-- USING checks existing row, WITH CHECK validates the updated row
CREATE POLICY "voice_profiles_update_own"
  ON public.voice_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own voice profiles
CREATE POLICY "voice_profiles_delete_own"
  ON public.voice_profiles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ============================================================================
-- GENERATED_POSTS TABLE POLICIES
-- 
-- Standard pattern: user_id = auth.uid()
-- Users can CRUD only their own generated posts
-- Additional check: voice_profile_id must belong to the user
-- ============================================================================

-- SELECT: Users can only read their own generated posts
CREATE POLICY "generated_posts_select_own"
  ON public.generated_posts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Users can only create posts for themselves
-- Additional security: Verify the voice_profile_id belongs to the user
CREATE POLICY "generated_posts_insert_own"
  ON public.generated_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.voice_profiles
      WHERE id = voice_profile_id
      AND user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update their own posts
-- Prevent changing user_id or voice_profile_id to another user's
CREATE POLICY "generated_posts_update_own"
  ON public.generated_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.voice_profiles
      WHERE id = voice_profile_id
      AND user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete their own posts
CREATE POLICY "generated_posts_delete_own"
  ON public.generated_posts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ============================================================================
-- SECURITY VERIFICATION QUERIES
-- Run these in the Supabase SQL Editor to verify RLS is working
-- ============================================================================

/*
-- Test 1: Verify RLS is enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'voice_profiles', 'generated_posts');
-- Expected: All should show rowsecurity = true

-- Test 2: List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

-- Test 3: Verify policy count
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename;
-- Expected: profiles=4, voice_profiles=4, generated_posts=4

-- Test 4: As User A, try to select User B's data (should return empty)
-- First, get User A's ID from auth.uid() in a session
-- Then manually try to query with a different user_id
-- Example (replace with actual UUIDs):
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub": "user-a-uuid"}';
-- SELECT * FROM voice_profiles WHERE user_id = 'user-b-uuid';
-- Expected: Empty result set (blocked by RLS)
*/


-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================
-- 
-- 1. SERVICE ROLE KEY BYPASSES RLS
--    - NEVER expose SUPABASE_SERVICE_ROLE_KEY to client
--    - Only use in server-side code (API routes)
--    - Use for admin operations that need to bypass RLS
-- 
-- 2. ANON KEY RESPECTS RLS
--    - Safe to use in client-side code
--    - Will only return data matching policies
--    - Unauthenticated users see nothing (no 'anon' policies)
-- 
-- 3. POLICY EVALUATION ORDER
--    - PostgreSQL evaluates USING clause first (for existing rows)
--    - Then WITH CHECK (for new/updated rows)
--    - Both must pass for operation to succeed
-- 
-- 4. NO PUBLIC ACCESS
--    - All policies are for 'authenticated' role only
--    - Anonymous users cannot access any data
--    - This is intentional for security
-- 
-- 5. CASCADE DELETIONS
--    - When auth.users row is deleted, profile is deleted (cascade)
--    - When profile is deleted, voice_profiles are deleted (cascade)
--    - When voice_profile is deleted, generated_posts are deleted (cascade)
--    - RLS doesn't block cascade deletions from parent tables
-- ============================================================================


-- ============================================================================
-- ROLLBACK COMMANDS (if needed)
-- ============================================================================
/*
-- To disable RLS (DANGEROUS - exposes all data):
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts DISABLE ROW LEVEL SECURITY;

-- To drop all policies:
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

DROP POLICY IF EXISTS "voice_profiles_select_own" ON public.voice_profiles;
DROP POLICY IF EXISTS "voice_profiles_insert_own" ON public.voice_profiles;
DROP POLICY IF EXISTS "voice_profiles_update_own" ON public.voice_profiles;
DROP POLICY IF EXISTS "voice_profiles_delete_own" ON public.voice_profiles;

DROP POLICY IF EXISTS "generated_posts_select_own" ON public.generated_posts;
DROP POLICY IF EXISTS "generated_posts_insert_own" ON public.generated_posts;
DROP POLICY IF EXISTS "generated_posts_update_own" ON public.generated_posts;
DROP POLICY IF EXISTS "generated_posts_delete_own" ON public.generated_posts;
*/
