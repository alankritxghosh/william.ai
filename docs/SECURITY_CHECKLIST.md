# William.ai Security Audit Checklist

Use this checklist before deploying to production. Every item must be verified.

## GO / NO-GO Decision

**Status: ____________________** (Fill in after completing checklist)

| Criteria | Required | Status |
|----------|----------|--------|
| All RLS tests pass | Yes | [ ] |
| No service role key in client | Yes | [ ] |
| All API routes authenticated | Yes | [ ] |
| Environment variables configured | Yes | [ ] |
| OAuth providers configured | Recommended | [ ] |
| Rate limiting enabled (Redis) | Recommended | [ ] |

**Decision:** [ ] GO for Production / [ ] NO-GO - Fix Issues First

---

## 1. Database Security

### Row Level Security (RLS)

- [ ] RLS enabled on `profiles` table
- [ ] RLS enabled on `voice_profiles` table
- [ ] RLS enabled on `generated_posts` table

**Verify with:**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'voice_profiles', 'generated_posts');
```
Expected: All `rowsecurity = true`

### RLS Policies

- [ ] `profiles` has 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] `voice_profiles` has 4 policies
- [ ] `generated_posts` has 4 policies

**Verify with:**
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies WHERE schemaname = 'public'
GROUP BY tablename;
```

### User Isolation

- [ ] User A cannot SELECT User B's voice profiles
- [ ] User A cannot UPDATE User B's voice profiles
- [ ] User A cannot DELETE User B's voice profiles
- [ ] User A cannot SELECT User B's generated posts
- [ ] User A cannot INSERT posts with User B's user_id

**Run security tests:**
```bash
npx ts-node tests/supabase-security.test.ts
```

### Constraints

- [ ] Email validation working (invalid emails rejected)
- [ ] quality_score constrained to 0-100
- [ ] status constrained to valid enum values
- [ ] Minimum 20 rules enforced on voice_profiles

---

## 2. Authentication Security

### Session Management

- [ ] JWT expiry configured (recommended: 1 hour)
- [ ] Refresh token rotation enabled
- [ ] Sessions stored in httpOnly cookies
- [ ] Cookies have `secure` flag in production
- [ ] Cookies have `sameSite: lax`

### Password Security

- [ ] Minimum 12 characters required
- [ ] Uppercase letter required
- [ ] Lowercase letter required
- [ ] Number required
- [ ] Special character required

### Email Verification

- [ ] Email verification enabled for signup
- [ ] Verification link expires appropriately
- [ ] Users cannot access app until verified

### OAuth Configuration

- [ ] Google OAuth configured (if used)
- [ ] GitHub OAuth configured (if used)
- [ ] Redirect URLs are exact matches (no wildcards)
- [ ] OAuth secrets stored securely

---

## 3. API Security

### Authentication Checks

- [ ] `/api/generate` requires authentication
- [ ] `/api/extract-insight` requires authentication
- [ ] `/api/health` is public (intentional)
- [ ] All routes use `authenticateRequest()` for double-check

### Rate Limiting

- [ ] Rate limiting enabled on `/api/generate` (5/min)
- [ ] Rate limiting enabled on `/api/extract-insight` (10/min)
- [ ] Rate limits are per-user (not just per-IP)
- [ ] Redis configured for production (in-memory won't work with serverless)

### Input Validation

- [ ] All request bodies validated with Zod
- [ ] Request size limits enforced
- [ ] Prompt injection protection enabled

### Error Handling

- [ ] No stack traces in error responses
- [ ] No database error details exposed
- [ ] Generic error messages for auth failures
- [ ] Detailed errors logged server-side only

---

## 4. Environment & Secrets

### Required Variables Set

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `GEMINI_API_KEY` configured

### Secret Protection

- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to git history
- [ ] `SUPABASE_SERVICE_ROLE_KEY` marked sensitive in Vercel
- [ ] No secrets in client-side bundle

**Verify no secrets in client bundle:**
```bash
# Build the app
npm run build

# Search for service role key pattern in .next folder
grep -r "service_role" .next/ || echo "✅ No service_role key found"
```

### Service Role Key Usage

- [ ] Only used in `lib/supabase/server.ts`
- [ ] Never imported in client components
- [ ] Never passed to client via props or context

---

## 5. Code Security

### No Sensitive Data Logging

- [ ] No `console.log` with passwords
- [ ] No `console.log` with API keys
- [ ] No `console.log` with user emails (except errors)
- [ ] No `console.log` with session tokens

**Search for potential issues:**
```bash
grep -r "console.log" lib/ app/ components/ | grep -i "password\|secret\|key\|token"
```

### No User IDs in URLs

- [ ] No routes like `/user/[userId]/profile`
- [ ] All user data fetched via session
- [ ] No user IDs in query parameters

### XSS Prevention

- [ ] React's automatic escaping used
- [ ] No `dangerouslySetInnerHTML` with user content
- [ ] User content sanitized before rendering

### Prompt Injection Prevention

- [ ] All user inputs to AI sanitized
- [ ] Suspicious patterns detected and filtered
- [ ] Content boundaries clearly marked

---

## 6. Infrastructure Security

### HTTPS

- [ ] All traffic over HTTPS in production
- [ ] HTTP redirects to HTTPS
- [ ] Secure cookies only sent over HTTPS

### CORS

- [ ] CORS configured for your domain only
- [ ] No wildcard (`*`) in production

### Headers

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`

---

## 7. Monitoring & Incident Response

### Error Tracking

- [ ] Sentry configured (or similar)
- [ ] Errors captured with context
- [ ] Sensitive data redacted from error reports

### Audit Logging

- [ ] Auth events logged (sign in, sign out, failures)
- [ ] API access patterns monitored
- [ ] Unusual activity alerts configured

### Incident Response

- [ ] Know how to revoke all sessions (Supabase dashboard)
- [ ] Know how to rotate API keys
- [ ] Know how to disable OAuth providers
- [ ] Have rollback plan ready

---

## 8. Pre-Deployment Verification

### Run All Checks

```bash
# 1. Run security tests
npx ts-node tests/supabase-security.test.ts

# 2. Build without errors
npm run build

# 3. Check for secret leaks
grep -r "eyJ" .next/ | head -5 || echo "✅ No JWT patterns in bundle"

# 4. Verify environment
curl https://your-domain.com/api/health
```

### Manual Testing

- [ ] Sign up with new email works
- [ ] Email verification email received
- [ ] Sign in with verified email works
- [ ] OAuth sign in works (Google/GitHub)
- [ ] Dashboard only accessible when logged in
- [ ] Voice profiles only show user's own data
- [ ] Sign out clears session
- [ ] Cannot access dashboard after sign out

---

## Security Contacts

In case of security incident:

- **Supabase Security**: security@supabase.io
- **Report vulnerabilities**: [Your security contact]
- **Incident response team**: [Your team contacts]

---

## Changelog

| Date | Reviewer | Status | Notes |
|------|----------|--------|-------|
| YYYY-MM-DD | [Name] | [PASS/FAIL] | [Notes] |

---

## Final Sign-Off

**Reviewed by:** ________________________

**Date:** ________________________

**Status:** [ ] APPROVED FOR PRODUCTION / [ ] REQUIRES FIXES

**Notes:**
