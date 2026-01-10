# 🚀 Migration Deployment Guide

## ✅ What's Been Done

1. **✅ Migration files cleaned and fixed**
   - Removed incomplete `DROP POLICY IF EXISTS` statements
   - Removed duplicate backup files
   - Renamed to proper timestamp: `20260109220802_complete_schema_setup.sql`

2. **✅ Test files created**
   - `supabase/tests/verify_migration.sql` - Database structure verification
   - `supabase/tests/test_rls_policies.sql` - RLS policy testing
   - `supabase/tests/test_realtime.ts` - Realtime functionality testing
   - `supabase/tests/TESTING_CHECKLIST.md` - Complete manual testing checklist

3. **✅ Local Supabase running**
   - Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
   - Studio: http://127.0.0.1:54323
   - REST API: http://127.0.0.1:54321/rest/v1

4. **✅ Already linked to production**
   - Project ID: `<YOUR_PROJECT_ID>`
   - Remote database is up to date

---

## 🧪 Next Steps: Testing

### Step 1: Verify Migration (5 minutes)

Open Supabase Studio at http://127.0.0.1:54323 and:

1. Go to **Table Editor** → Check all 13 tables exist:
   - ✅ profiles
   - ✅ personality_scores
   - ✅ dealbreakers
   - ✅ matches
   - ✅ messages
   - ✅ achievements
   - ✅ subscriptions
   - ✅ notifications
   - ✅ push_subscriptions
   - ✅ user_daily_match_pools
   - ✅ user_match_delivery_status
   - ✅ consents
   - ✅ privacy_settings

2. Go to **SQL Editor** → Run `supabase/tests/verify_migration.sql`
   - Should show table counts, policies, triggers, functions

### Step 2: Test RLS Policies (10 minutes)

1. Create a test user in **Authentication** → Users
2. Copy the user's UUID
3. In **SQL Editor**, run queries from `supabase/tests/test_rls_policies.sql`
4. Verify:
   - ✅ User can view their own profile
   - ✅ User cannot view other profiles
   - ✅ User can insert/update their own data

### Step 3: Test Realtime (5 minutes)

1. In your app, import the test functions:
   ```typescript
   import { testNotificationsRealtime, testMatchesRealtime } from './supabase/tests/test_realtime'
   ```

2. Run in browser console:
   ```javascript
   testNotificationsRealtime()
   ```

3. Watch for realtime updates in console

### Step 4: Enable Realtime for Tables

In Supabase Dashboard → **Database** → **Replication**:

Enable realtime for these tables:
- ✅ messages
- ✅ notifications  
- ✅ matches
- ✅ achievements

---

## 🚀 Production Deployment

### Option A: Using CLI (Recommended)

```bash
# Make sure you're linked to production
supabase link --project-ref <YOUR_PROJECT_ID>

# Push migrations (already done, but can re-run if needed)
supabase db push

# Verify
supabase db remote commit
```

### Option B: Using Dashboard

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy contents of `supabase/migrations/20260109220802_complete_schema_setup.sql`
3. Paste and run
4. Copy contents of `supabase/migrations/20260109232120_remote_schema.sql`
5. Paste and run

---

## 📊 Post-Deployment Verification

### 1. Check Migration History

```bash
supabase migration list --remote
```

Should show:
- `20260109220802_complete_schema_setup.sql` ✅ Applied
- `20260109232120_remote_schema.sql` ✅ Applied

### 2. Verify in Production Dashboard

1. Go to https://supabase.com/dashboard/project/<YOUR_PROJECT_ID>
2. **Table Editor** → Verify all tables exist
3. **Database** → **Policies** → Verify RLS policies
4. **Logs** → Check for any errors

### 3. Test Production API

**Security Note:** Obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the Supabase project dashboard under Settings → API.

**⚠️ WARNING:** Never commit `.env` files, store keys in shell history, or keep credentials in source control. Use credential managers in production.

**Option A: Using .env file (recommended)**
```bash
# Create .env.local (add to .gitignore!)
echo 'SUPABASE_URL="your-project-url"' > .env.local
echo 'SUPABASE_ANON_KEY="your-anon-key"' >> .env.local

# Load environment variables
set -a && source .env.local && set +a

# Test a simple query
curl "$SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

**Option B: One-off command (avoids shell history)**
```bash
SUPABASE_URL="your-project-url" SUPABASE_ANON_KEY="your-anon-key" \
curl "$SUPABASE_URL/rest/v1/profiles" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

---

## 🎯 Testing Checklist Summary

Use the complete checklist at `supabase/tests/TESTING_CHECKLIST.md`

**Quick verification:**
- [ ] All 13 tables created
- [ ] RLS policies working (test with 2 users)
- [ ] Triggers working (test updated_at)
- [ ] Realtime subscriptions working
- [ ] No errors in logs
- [ ] Performance acceptable (<100ms queries)

---

## 🐛 Troubleshooting

### Issue: "Remote database is up to date" but changes not applied

**⚠️ DANGER: `supabase db reset --remote` IS DESTRUCTIVE AND WILL DELETE ALL REMOTE DATA!**

**Before running reset, try these safer alternatives:**
1. Inspect migration history: `supabase migration list --remote`
2. Review commit history and perform manual rollback if needed
3. Restore from a database backup or snapshot (Supabase Dashboard → Database → Backups)
4. Contact your infrastructure/DBA team for assistance
5. Test with `--dry-run` flag if available, or test locally first with `supabase db reset`

**Only use reset as a last resort:**
```bash
# THIS WILL DELETE ALL REMOTE DATA - USE WITH EXTREME CAUTION
supabase db reset --remote
supabase db push
```

### Issue: RLS policies blocking all queries

1. Check user is authenticated: 
   ```sql
   SELECT auth.uid();
   ```
2. Temporarily disable RLS to test:
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

### Issue: Realtime not working

1. Enable replication in Dashboard → Database → Replication
2. Add tables to publication:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```

### Issue: Slow queries

1. Check if indexes are being used:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM matches WHERE user_id = 'uuid';
   ```
2. Should see "Index Scan" not "Seq Scan"

---

## 📝 Migration Files

Current migration files:
- `20260109220802_complete_schema_setup.sql` - Main schema setup
- `20260109232120_remote_schema.sql` - Remote schema adjustments

Test files:
- `supabase/tests/verify_migration.sql` - Structure verification
- `supabase/tests/test_rls_policies.sql` - RLS testing  
- `supabase/tests/test_realtime.ts` - Realtime testing
- `supabase/tests/TESTING_CHECKLIST.md` - Complete checklist

---

## ✨ Summary

**Status: ✅ Ready for Testing & Production**

Your migration is:
- ✅ Syntactically correct
- ✅ Applied locally
- ✅ Synced with production
- ✅ Test files created
- ✅ Documentation complete

**Next actions:**
1. Follow testing checklist
2. Enable realtime for tables
3. Test with real users
4. Monitor logs for issues

---

Need help? Check:
- 📖 [Testing Checklist](./tests/TESTING_CHECKLIST.md)
- 🧪 [RLS Tests](./tests/test_rls_policies.sql)
- 📡 [Realtime Tests](./tests/test_realtime.ts)
