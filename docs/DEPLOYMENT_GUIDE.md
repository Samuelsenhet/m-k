# MÄÄK MVP - Deployment Guide

**Date**: 2026-01-09  
**Status**: Ready to Deploy  
**Estimated Time**: 30-45 minutes

---

## 🎯 Overview

This guide will walk you through deploying all backend and frontend changes for the MÄÄK MVP. Since CLI permissions are limited, we'll use the Supabase Dashboard for backend deployment.

---

## Step 1: Deploy Database Migration (Supabase Dashboard)

### 1.1 Access SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **jfhaahfvzzcgabtijovr**
3. Navigate to: **SQL Editor** (left sidebar)

### 1.2 Execute Migration SQL

Click "New Query" and paste the following SQL:

```sql
-- Migration: Add consent and privacy tables for GDPR compliance
-- Date: 2026-01-09

-- 1. Consents Table
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consented BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_consents_user_id ON public.consents(user_id);
CREATE INDEX idx_consents_type ON public.consents(consent_type);
CREATE INDEX idx_consents_user_type ON public.consents(user_id, consent_type);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON public.consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Privacy Settings Table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  profile_visible BOOLEAN NOT NULL DEFAULT true,
  show_age BOOLEAN NOT NULL DEFAULT true,
  show_location BOOLEAN NOT NULL DEFAULT true,
  show_last_active BOOLEAN NOT NULL DEFAULT true,
  discoverable BOOLEAN NOT NULL DEFAULT true,
  allow_messages_from TEXT NOT NULL DEFAULT 'matches',
  read_receipts_enabled BOOLEAN NOT NULL DEFAULT true,
  typing_indicators_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  match_notifications BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  share_analytics BOOLEAN NOT NULL DEFAULT true,
  share_for_research BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_privacy_settings_user_id ON public.privacy_settings(user_id);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own privacy settings"
  ON public.privacy_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
  ON public.privacy_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
  ON public.privacy_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Add onboarding_completed_at column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- 4. Create default privacy settings function
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Trigger for privacy settings
CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_privacy_settings();

-- 6. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_privacy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_consents_updated_at
  BEFORE UPDATE ON public.consents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_privacy_updated_at();

CREATE TRIGGER set_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_privacy_updated_at();

-- 7. Seed existing users with consents
INSERT INTO public.consents (user_id, consent_type, consented, consented_at)
SELECT 
  id,
  consent_type,
  true,
  created_at
FROM auth.users
CROSS JOIN (
  VALUES 
    ('terms_of_service'),
    ('privacy_policy'),
    ('data_processing')
) AS ct(consent_type)
ON CONFLICT (user_id, consent_type) DO NOTHING;

-- 8. Update existing users with onboarding timestamp
UPDATE public.profiles
SET onboarding_completed_at = created_at
WHERE onboarding_completed = true 
  AND onboarding_completed_at IS NULL;

-- Comments
COMMENT ON TABLE public.consents IS 'GDPR consent tracking';
COMMENT ON TABLE public.privacy_settings IS 'User privacy preferences';
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS '24-hour wait enforcement';
```

### 1.3 Verify Migration

Run this query to verify:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN ('consents', 'privacy_settings');

-- Check new column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'onboarding_completed_at';

-- Check consent count (should be 3x user count)
SELECT COUNT(*) as consent_records FROM public.consents;
SELECT COUNT(*) as user_count FROM auth.users;
```

**Expected**: 2 tables, 1 column, consent_records ≈ 3 × user_count

---

## Step 2: Deploy Edge Functions

### 2.1 Update match-daily Function

1. In Supabase Dashboard: **Edge Functions** → **match-daily**
2. Click "Edit function"
3. Replace content with the updated code from:
   `/supabase/functions/match-daily/index.ts`

**Key Changes**:
- Added 24-hour wait enforcement
- Added `onboarding_completed_at` check
- Added `special_event_message` field
- Added first match detection logic

### 2.2 Update match-status Function

1. Navigate to: **Edge Functions** → **match-status**
2. Click "Edit function"
3. Code is already correct (no changes needed if deployed previously)

### 2.3 Deploy Functions

For each function:
1. Click **"Deploy"** button
2. Wait for deployment success message
3. Test endpoint using "Test" tab

---

## Step 3: Test Backend Deployment

### 3.1 Test Database

Run in SQL Editor:

```sql
-- Test consent table
SELECT * FROM public.consents LIMIT 5;

-- Test privacy settings
SELECT * FROM public.privacy_settings LIMIT 5;

-- Test profiles column
SELECT id, onboarding_completed, onboarding_completed_at 
FROM public.profiles 
WHERE onboarding_completed = true 
LIMIT 5;
```

### 3.2 Test match-status Endpoint

In Edge Functions → match-status → Test tab:

```json
{
  "user_id": "your-test-user-id"
}
```

**Expected Response**:
```json
{
  "journey_phase": "WAITING" | "READY" | "FIRST_MATCH",
  "time_remaining": "12h 30m",
  "delivered_today": 0,
  "next_reset_time": "2026-01-10T00:00:00+01:00"
}
```

### 3.3 Test match-daily Endpoint

In Edge Functions → match-daily → Test tab:

```json
{
  "user_id": "your-test-user-id"
}
```

**If < 24 hours since onboarding**:
```json
{
  "journey_phase": "WAITING",
  "message": "Din första matchning kommer snart!",
  "time_remaining": "18h 42m"
}
```

**If >= 24 hours**:
```json
{
  "date": "2026-01-09",
  "batch_size": 5,
  "user_limit": 5,
  "matches": [...],
  "special_event_message": "🎉 Dina första matchningar är här!"
}
```

---

## Step 4: Deploy Frontend (Already Done ✅)

The frontend changes are already in your local repo:

**New Components Created**:
- ✅ `/src/components/journey/WaitingPhase.tsx`
- ✅ `/src/components/journey/FirstMatchCelebration.tsx`
- ✅ `/src/hooks/useMatchStatus.ts`

**Updated Components**:
- ✅ `/src/pages/Matches.tsx` (integrated journey phases)

**Dependencies Installed**:
- ✅ `canvas-confetti` (celebration animation)
- ✅ `@types/canvas-confetti` (TypeScript types)

### 4.1 Build and Deploy

If using Vercel:

```bash
# Build locally to test
npm run build

# Deploy to Vercel (if connected)
vercel --prod

# Or commit and push (if auto-deploy enabled)
git add .
git commit -m "feat: add journey phases and GDPR compliance"
git push origin main
```

---

## Step 5: End-to-End Testing

### 5.1 Test New User Journey

1. **Create Test User**:
   - Go to app
   - Sign up with new phone number
   - Complete onboarding (personality test, photos, etc.)

2. **Verify WAITING Phase**:
   - Navigate to Matches page
   - Should see: Waiting phase UI with countdown timer
   - Should show: "Din första matchning kommer snart!"
   - Countdown should show ~24 hours remaining

3. **Simulate 24-Hour Wait** (for testing):
   ```sql
   -- In Supabase SQL Editor
   UPDATE public.profiles 
   SET onboarding_completed_at = NOW() - INTERVAL '25 hours'
   WHERE user_id = 'test-user-id';
   ```

4. **Verify READY Phase**:
   - Refresh Matches page
   - Call match-daily API
   - Should receive matches with `special_effects: ['confetti', 'celebration']`

5. **Verify FIRST_MATCH Celebration**:
   - Confetti animation should trigger
   - Mascot should show celebration
   - Special message should appear
   - Auto-dismiss after 5 seconds

### 5.2 Test Existing User Journey

1. **Login as Existing User**:
   - Should skip waiting phase (already completed onboarding > 24h ago)
   - Should see normal match list
   - No celebration (not first match)

2. **Test Privacy Settings**:
   ```sql
   -- Verify privacy settings exist for user
   SELECT * FROM public.privacy_settings WHERE user_id = 'user-id';
   ```

3. **Test Consent Tracking**:
   ```sql
   -- Verify consents exist
   SELECT * FROM public.consents WHERE user_id = 'user-id';
   ```

### 5.3 Test Free vs Plus

1. **Free User**:
   - Should receive max 5 matches
   - `user_limit: 5` in API response

2. **Plus User**:
   - Should receive full batch size
   - `user_limit: null` in API response

---

## Step 6: Monitoring & Validation

### 6.1 Check Database Health

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
```

### 6.2 Monitor Edge Function Logs

1. Go to: **Edge Functions** → Select function → **Logs** tab
2. Look for errors or unexpected behavior
3. Monitor response times (should be < 500ms)

### 6.3 Frontend Error Monitoring

Check browser console for:
- API call failures
- React component errors
- Animation performance issues

---

## Step 7: Launch Checklist ✅

### Pre-Launch Verification

- [ ] Database migration successful (2 new tables, 1 new column)
- [ ] Edge functions deployed (match-daily, match-status)
- [ ] Waiting phase UI displays correctly
- [ ] Celebration animation works (confetti + mascot)
- [ ] 24-hour wait enforced for new users
- [ ] Existing users bypass waiting phase
- [ ] Free cap (5 matches) working
- [ ] Plus users get uncapped matches
- [ ] GDPR consent tracking active
- [ ] Privacy settings created for all users
- [ ] No TypeScript/React errors in console
- [ ] Mobile responsive (test on phone)
- [ ] Performance acceptable (< 3s load time)

### Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates in Supabase logs
- [ ] Check user signup → onboarding → match flow
- [ ] Verify no users stuck in waiting phase > 24h
- [ ] Confirm celebration shows for first matches only
- [ ] Review database table growth (consents, privacy_settings)
- [ ] Check for any RLS policy violations

---

## Rollback Plan (If Needed)

### Rollback Database

```sql
-- Remove new tables (CAUTION: destroys data)
DROP TABLE IF EXISTS public.consents CASCADE;
DROP TABLE IF EXISTS public.privacy_settings CASCADE;

-- Remove new column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS onboarding_completed_at;
```

### Rollback Edge Functions

1. Go to Edge Functions → Function → **Version History**
2. Select previous working version
3. Click "Restore"

### Rollback Frontend

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback Vercel deployment
vercel rollback
```

---

## Troubleshooting

### Issue: "Permission denied" in SQL Editor

**Solution**: Contact project owner to grant SQL access or use Service Role key

### Issue: Edge function not updating

**Solution**: 
1. Check function logs for deployment errors
2. Try "Force redeploy"
3. Verify no syntax errors in code

### Issue: Waiting phase not showing

**Possible Causes**:
- `onboarding_completed_at` not set → Run update SQL
- API not returning `journey_phase` → Check match-status logs
- Frontend not checking status → Verify useMatchStatus hook

### Issue: Celebration not triggering

**Possible Causes**:
- `special_effects` field missing → Check match-daily response
- First match detection wrong → Verify logic in Edge Function
- confetti library not loaded → Check npm install success

---

## Support Contacts

- **Technical Issues**: Check `/docs/` folder
- **Database Questions**: Supabase Dashboard → Support
- **Frontend Bugs**: Check browser console + React DevTools

---

## Success Metrics to Track

After launch, monitor:

1. **User Journey Completion Rate**:
   - Signup → Onboarding → Waiting → First Match

2. **24-Hour Wait Compliance**:
   - No users receiving matches < 24 hours after onboarding

3. **Celebration Trigger Rate**:
   - First match celebration shows for 100% of first matches

4. **API Response Times**:
   - match-daily: < 500ms
   - match-status: < 200ms

5. **Error Rates**:
   - Target: < 1% of requests

---

**Deployment Guide Owner**: Backend Team  
**Last Updated**: 2026-01-09  
**Next Review**: After first production deployment

🎉 **Ready to launch MÄÄK MVP!**
