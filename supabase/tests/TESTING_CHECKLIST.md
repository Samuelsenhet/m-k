# 🧪 Migration Testing Checklist

Complete this checklist to verify the database migration is working correctly.

## ✅ 1. Database Structure

Run `supabase/tests/verify_migration.sql` in SQL Editor or use:
```bash
supabase db execute -f supabase/tests/verify_migration.sql
```

- [ ] All 13 tables created successfully
  - [ ] profiles
  - [ ] personality_scores
  - [ ] dealbreakers
  - [ ] matches
  - [ ] messages
  - [ ] achievements
  - [ ] subscriptions
  - [ ] notifications
  - [ ] push_subscriptions
  - [ ] user_daily_match_pools
  - [ ] user_match_delivery_status
  - [ ] consents
  - [ ] privacy_settings

- [ ] All indexes created (check output from verify_migration.sql)
- [ ] All triggers created (8 triggers for updated_at, 2 for auto-creation)
- [ ] All functions created (3 functions)
- [ ] No SQL errors in Supabase logs

## 🔒 2. RLS Policies

Run `supabase/tests/test_rls_policies.sql` as authenticated users:

### Single User Tests (Run these as User A)
- [ ] User can view their own profile
- [ ] User cannot view other profiles (before match)
- [ ] User can view their own personality scores
- [ ] User cannot view others' personality scores (before match)
- [ ] User can view their own dealbreakers
- [ ] User can view their own matches
- [ ] User can insert their own profile
- [ ] User can update their own profile
- [ ] User can insert their own personality scores
- [ ] User can view their own notifications
- [ ] User can view their own privacy settings

### Multi-User Match Tests (Need User A & User B)
- [ ] Create mutual match between User A and User B
- [ ] User A can now view User B's profile
- [ ] User B can now view User A's profile
- [ ] User A can view User B's personality scores
- [ ] User B can view User A's personality scores
- [ ] User A can send messages to User B
- [ ] User B can send messages to User A
- [ ] Both can view messages in their shared match

## ⚡ 3. Triggers & Automation

Test these scenarios:

### Updated_at Triggers
- [ ] Update a profile → `updated_at` timestamp updates automatically
- [ ] Update personality scores → `updated_at` updates
- [ ] Update dealbreakers → `updated_at` updates
- [ ] Update messages → `updated_at` updates
- [ ] Update subscriptions → `updated_at` updates
- [ ] Update consents → `updated_at` updates
- [ ] Update privacy settings → `updated_at` updates

### Auto-Creation Triggers
- [ ] Create new profile → privacy_settings created automatically
- [ ] Create new profile → user_match_delivery_status created automatically

## 📡 4. Realtime Functionality

Use `supabase/tests/test_realtime.ts` or test manually:

### Messages Realtime
- [ ] Subscribe to messages channel for a match
- [ ] Send a message → it appears in realtime
- [ ] Other user receives message notification in realtime

### Notifications Realtime
- [ ] Subscribe to notifications channel
- [ ] Create a notification → it appears in realtime
- [ ] Notification counter updates in UI

### Presence
- [ ] User goes online → presence state updates
- [ ] User goes offline → presence state updates
- [ ] Other users can see online/offline status

### Matches Realtime
- [ ] New match created → notification sent in realtime
- [ ] Match status changes → both users notified

## 🚀 5. Performance

### Query Performance
Run these in SQL Editor with EXPLAIN ANALYZE:
```sql
EXPLAIN ANALYZE SELECT * FROM matches WHERE user_id = 'test-uuid';
EXPLAIN ANALYZE SELECT * FROM messages WHERE match_id = 'test-uuid';
EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = 'test-uuid';
```

- [ ] Queries use indexes (look for "Index Scan" not "Seq Scan")
- [ ] Simple queries < 10ms
- [ ] Complex queries < 100ms
- [ ] No slow queries in logs (check Supabase Dashboard → Logs)

### Indexes Verification
- [ ] `idx_matches_user_id` exists and is used
- [ ] `idx_matches_matched_user_id` exists and is used
- [ ] `idx_matches_status` exists and is used
- [ ] `idx_messages_match_id` exists and is used
- [ ] `idx_messages_sender_id` exists and is used
- [ ] `idx_user_daily_match_pools_user_date` exists
- [ ] `idx_notifications_user_id` exists

## ✅ 6. Data Validation

Test constraint validation:

- [ ] Cannot create profile with invalid phone format (if validation added)
- [ ] Cannot set personality score > 100 or < 0
- [ ] Cannot match user with themselves
- [ ] Min age must be <= max age in dealbreakers
- [ ] Valid subscription plan types only (free, premium, vip)
- [ ] Valid subscription status only (active, cancelled, expired)
- [ ] Valid match status only (pending, liked, disliked, mutual)

## 🔐 7. GDPR Compliance

- [ ] Users can view their own consents
- [ ] Users can grant/revoke consents
- [ ] Consent history is tracked (granted_at, revoked_at)
- [ ] Privacy settings work correctly
- [ ] Users can export their data (if export function added)
- [ ] Users can delete their account (cascade deletes work)

## 🧹 8. Testing Commands

### Local Testing
```bash
# Reset and test locally
supabase db reset

# Run verification
supabase db execute -f supabase/tests/verify_migration.sql

# Check logs
supabase logs -f
```

### Production Deployment
```bash
# Link to production
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Push migrations
supabase db push

# Verify in production
supabase db execute -f supabase/tests/verify_migration.sql --remote
```

## 📊 9. Manual Testing in Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Verify all tables appear
3. Try to insert/update/delete data
4. Check RLS policies are enforced
5. Go to SQL Editor and run test queries
6. Check Logs for any errors

## ✨ 10. Final Verification

- [ ] All tables created ✅
- [ ] All RLS policies working ✅
- [ ] All triggers working ✅
- [ ] Realtime working ✅
- [ ] Performance acceptable ✅
- [ ] No errors in logs ✅
- [ ] Production deployment successful ✅

---

## 🎯 Quick Start Testing

1. **Verify Structure**: Run `verify_migration.sql`
2. **Test RLS**: Run `test_rls_policies.sql` as authenticated user
3. **Test Realtime**: Import and run `test_realtime.ts` functions
4. **Deploy**: Run `supabase db push` for production

## 🐛 Troubleshooting

### Common Issues

**RLS Blocking All Queries**
- Check that user is authenticated: `SELECT auth.uid()`
- Verify policy matches user's ID
- Check policy uses correct table column names

**Realtime Not Working**
- Enable Realtime in Supabase Dashboard → Database → Replication
- Check tables are added to publication: `supabase_realtime`
- Verify subscription channel names match

**Slow Queries**
- Run EXPLAIN ANALYZE to check if indexes are used
- Add missing indexes
- Check for N+1 query problems

**Triggers Not Firing**
- Check trigger conditions (WHEN clause)
- Verify function exists: `\df public.*` in psql
- Check for errors in logs
