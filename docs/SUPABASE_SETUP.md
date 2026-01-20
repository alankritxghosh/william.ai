# Supabase Setup Guide for William.ai

This guide walks you through setting up Supabase for William.ai with maximum security.

## Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Run Database Migrations](#2-run-database-migrations)
3. [Configure Authentication](#3-configure-authentication)
4. [Configure OAuth Providers](#4-configure-oauth-providers)
5. [Set Environment Variables](#5-set-environment-variables)
6. [Test RLS Policies](#6-test-rls-policies)
7. [Security Checklist](#7-security-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `william-ai` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to your users
4. Click **Create new project**
5. Wait for the project to be provisioned (~2 minutes)

---

## 2. Run Database Migrations

### Option A: Via Supabase Dashboard (Recommended for first setup)

1. Go to your project's **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**
6. Repeat for `supabase/migrations/002_rls_policies.sql`

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

### Verify Tables Created

In the Supabase Dashboard, go to **Table Editor** and verify:

- `profiles` table exists
- `voice_profiles` table exists
- `generated_posts` table exists

### Verify RLS Enabled

In **Authentication > Policies**, verify each table shows:
- RLS: **Enabled**
- 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

---

## 3. Configure Authentication

### Email Settings

1. Go to **Authentication > Providers > Email**
2. Ensure **Enable Email Signup** is ON
3. Configure email templates (optional):
   - Go to **Authentication > Email Templates**
   - Customize confirmation and reset emails

### URL Configuration

1. Go to **Authentication > URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/confirm
   ```
4. For production, add your domain:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/auth/confirm
   ```

### Session Settings

1. Go to **Authentication > Settings**
2. Set **JWT expiry**: `3600` (1 hour) - tokens auto-refresh
3. Enable **Refresh Token Rotation**: ON

---

## 4. Configure OAuth Providers

### Google OAuth

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Configure consent screen if prompted:
   - User Type: **External**
   - App name: **William.ai**
   - Scopes: Default (email, profile)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://YOUR_PROJECT_REF.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
7. Copy **Client ID** and **Client Secret**

#### Step 2: Add to Supabase

1. Go to **Authentication > Providers > Google**
2. Toggle **Enable Sign in with Google**: ON
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

### GitHub OAuth

#### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App**
3. Fill in:
   - **Application name**: William.ai
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: 
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Click **Generate a new client secret** and copy it

#### Step 2: Add to Supabase

1. Go to **Authentication > Providers > GitHub**
2. Toggle **Enable Sign in with GitHub**: ON
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

---

## 5. Set Environment Variables

### Get Your API Keys

1. Go to **Settings > API** in your Supabase project
2. Copy:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **anon (public)** key
   - **service_role** key (keep this SECRET!)

### Create .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Required
GEMINI_API_KEY=your-gemini-key

# Optional but recommended
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Vercel Deployment

Add these environment variables in Vercel Dashboard:

1. Go to your project's **Settings > Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development**
3. Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive**

---

## 6. Test RLS Policies

Run these tests to verify Row Level Security is working:

### Test 1: Verify RLS is Enabled

In **SQL Editor**, run:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'voice_profiles', 'generated_posts');
```

Expected: All rows show `rowsecurity = true`

### Test 2: Count Policies

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename;
```

Expected: Each table has 4 policies

### Test 3: Verify User Isolation

1. Create two test users in **Authentication > Users**
2. As User A (via your app), create a voice profile
3. Note the profile ID
4. As User B, try to access that profile ID
5. Expected: Empty result (User B cannot see User A's data)

### Test 4: Test Cascade Deletion

1. Create a user with voice profiles and posts
2. Delete the user from **Authentication > Users**
3. Check `profiles`, `voice_profiles`, `generated_posts` tables
4. Expected: All related data is deleted

---

## 7. Security Checklist

Before going to production, verify:

### Database Security

- [ ] RLS enabled on ALL tables (`profiles`, `voice_profiles`, `generated_posts`)
- [ ] Each table has 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Tested: User A cannot access User B's data
- [ ] Cascade deletions working correctly

### API Security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in any client-side code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT committed to git
- [ ] All API routes use `authenticateRequest()` for auth check
- [ ] All API routes filter by `user_id` even with RLS

### Authentication Security

- [ ] Email verification enabled (users must verify email)
- [ ] Strong password requirements enforced (12+ chars, mixed case, numbers, symbols)
- [ ] OAuth providers configured correctly
- [ ] Redirect URLs are exact matches (no wildcards)
- [ ] Session expiry configured (recommended: 1 hour with refresh)

### Environment Security

- [ ] `.env.local` is in `.gitignore`
- [ ] Production secrets stored in Vercel/hosting environment variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` marked as sensitive in Vercel

### Code Security

- [ ] No `console.log` with user data
- [ ] No user IDs in URLs (use session)
- [ ] Generic error messages (no "user not found" vs "wrong password")
- [ ] Input validation with Zod on all forms
- [ ] Prompt injection protection on AI inputs

---

## 8. Troubleshooting

### "User not found" after signup

**Cause**: Email verification not completed

**Solution**: Check email for verification link, or disable email verification for testing:
1. Go to **Authentication > Providers > Email**
2. Toggle **Confirm email** OFF (development only!)

### "Permission denied" errors

**Cause**: RLS policies blocking access

**Solution**: 
1. Verify user is authenticated
2. Verify `user_id` matches `auth.uid()`
3. Check policy definitions in **Authentication > Policies**

### OAuth redirect errors

**Cause**: Mismatched redirect URLs

**Solution**:
1. In Google/GitHub console, add exact URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
2. In Supabase URL Configuration, add:
   ```
   http://localhost:3000/auth/callback
   ```

### Profile not created after signup

**Cause**: Trigger not working

**Solution**: Manually run the trigger creation:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Rate limiting not working

**Cause**: Redis not configured

**Solution**:
1. For production, configure Upstash Redis
2. For development, in-memory fallback is OK but doesn't persist

---

## Quick Reference

### Supabase Dashboard URLs

- Project Dashboard: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- SQL Editor: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql`
- Auth Settings: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/settings`
- API Settings: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api`

### Callback URLs

| Purpose | URL |
|---------|-----|
| OAuth Callback (Supabase) | `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` |
| App Callback | `http://localhost:3000/auth/callback` |
| Email Confirm | `http://localhost:3000/auth/confirm` |

### Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Database tables and triggers |
| `supabase/migrations/002_rls_policies.sql` | Row Level Security policies |
| `lib/supabase/client.ts` | Browser client |
| `lib/supabase/server.ts` | Server client |
| `middleware.ts` | Auth middleware |
