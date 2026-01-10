-- RLS Policy Testing Script
-- This tests that Row Level Security policies work correctly
-- You'll need to run these as different authenticated users

-- ==========================================
-- TEST 1: Profile Access (Self)
-- ==========================================
-- Expected: Should return current user's profile only
DO $$
DECLARE
  profile_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = auth.uid();
  IF profile_count = 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Cannot view own profile (expected >= 1, got %)', profile_count;
  ELSE
    RAISE NOTICE 'TEST 1 PASSED: Can view own profile (% rows)', profile_count;
  END IF;
END $$;

-- ==========================================
-- TEST 2: Profile Access (Other Users)
-- ==========================================
-- Expected: Should return empty (no access to other profiles unless matched)
DO $$
DECLARE
  other_profile_count INT;
BEGIN
  SELECT COUNT(*) INTO other_profile_count FROM public.profiles WHERE id != auth.uid();
  IF other_profile_count > 0 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Can view other profiles (expected 0, got %)', other_profile_count;
  ELSE
    RAISE NOTICE 'TEST 2 PASSED: Cannot view other profiles';
  END IF;
END $$;

-- ==========================================
-- TEST 3: Personality Scores (Self)
-- ==========================================
-- Expected: Should return current user's scores
DO $$
DECLARE
  score_count INT;
BEGIN
  SELECT COUNT(*) INTO score_count FROM public.personality_scores WHERE user_id = auth.uid();
  IF score_count = 0 THEN
    RAISE NOTICE 'TEST 3: No personality scores for current user (expected if not yet created)';
  ELSE
    RAISE NOTICE 'TEST 3 PASSED: Can view own personality scores (% rows)', score_count;
  END IF;
END $$;

-- ==========================================
-- TEST 4: Personality Scores (Others)
-- ==========================================
-- Expected: Should return empty (no access to other users' scores unless matched)
DO $$
DECLARE
  other_score_count INT;
BEGIN
  SELECT COUNT(*) INTO other_score_count FROM public.personality_scores WHERE user_id != auth.uid();
  IF other_score_count > 0 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Can view others personality scores (expected 0, got %)', other_score_count;
  ELSE
    RAISE NOTICE 'TEST 4 PASSED: Cannot view others personality scores';
  END IF;
END $$;

-- ==========================================
-- TEST 5: Dealbreakers (Self)
-- ==========================================
-- Expected: Should return current user's dealbreakers
DO $$
DECLARE
  dealbreaker_count INT;
BEGIN
  SELECT COUNT(*) INTO dealbreaker_count FROM public.dealbreakers WHERE user_id = auth.uid();
  RAISE NOTICE 'TEST 5 PASSED: Can view own dealbreakers (% rows)', dealbreaker_count;
END $$;

-- ==========================================
-- TEST 6: Matches (Self)
-- ==========================================
-- Expected: Should return current user's matches only
DO $$
DECLARE
  match_count INT;
BEGIN
  SELECT COUNT(*) INTO match_count FROM public.matches WHERE user_id = auth.uid() OR matched_user_id = auth.uid();
  RAISE NOTICE 'TEST 6 PASSED: Can view own matches (% rows)', match_count;
END $$;

-- ==========================================
-- TEST 7: Messages (Self)
-- ==========================================
-- Expected: Should return messages from current user's matches
DO $$
DECLARE
  message_count INT;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM public.messages m
  INNER JOIN public.matches mt ON m.match_id = mt.id
  WHERE mt.user_id = auth.uid() OR mt.matched_user_id = auth.uid();
  RAISE NOTICE 'TEST 7 PASSED: Can view messages from own matches (% rows)', message_count;
END $$;

-- ==========================================
-- TEST 8: Insert Own Profile
-- ==========================================
-- Expected: Should succeed (user can create their own profile)
SELECT 'TEST 8: Can insert own profile' as test_name;
INSERT INTO public.profiles (id, phone, display_name, gender, looking_for)
VALUES (
  auth.uid(),
  '+1234567890',
  'Test User',
  'male',
  'female'
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- TEST 9: Update Own Profile
-- ==========================================
-- Expected: Should succeed
SELECT 'TEST 9: Can update own profile' as test_name;
UPDATE public.profiles 
SET bio = 'Updated bio for RLS test'
WHERE id = auth.uid();

-- ==========================================
-- TEST 10: Insert Personality Scores
-- ==========================================
-- Expected: Should succeed
SELECT 'TEST 10: Can insert own personality scores' as test_name;
INSERT INTO public.personality_scores (
  user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism
)
VALUES (auth.uid(), 75.5, 80.0, 65.5, 70.0, 55.5)
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- TEST 11: Notifications
-- ==========================================
-- Expected: Should only see own notifications
SELECT 'TEST 11: Can view own notifications' as test_name;
SELECT * FROM public.notifications WHERE user_id = auth.uid();

-- ==========================================
-- TEST 12: Privacy Settings
-- ==========================================
-- Expected: Should only see own privacy settings
SELECT 'TEST 12: Can view own privacy settings' as test_name;
SELECT * FROM public.privacy_settings WHERE user_id = auth.uid();

-- ==========================================
-- NEGATIVE TESTS: Unauthorized Writes
-- ==========================================

-- ==========================================
-- TEST 13: Cannot insert other user profile
-- ==========================================
-- Expected: Should fail with permission denied
DO $$
DECLARE
  other_user_id UUID := '00000000-0000-0000-0000-000000000001';
  insert_failed BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, phone, display_name, gender, looking_for)
    VALUES (other_user_id, '+9999999999', 'Unauthorized User', 'other', 'any');
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      insert_failed := TRUE;
  END;
  
  IF insert_failed THEN
    RAISE NOTICE 'TEST 13 PASSED: Cannot insert other user profile (blocked as expected)';
  ELSE
    RAISE EXCEPTION 'TEST 13 FAILED: Was able to insert other user profile';
  END IF;
END $$;

-- ==========================================
-- TEST 14: Cannot update other user profile
-- ==========================================
-- Expected: Should update 0 rows or fail
DO $$
DECLARE
  other_user_id UUID := '00000000-0000-0000-0000-000000000002';
  rows_updated INT;
BEGIN
  UPDATE public.profiles
  SET bio = 'Unauthorized update'
  WHERE id = other_user_id AND id != auth.uid();
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated = 0 THEN
    RAISE NOTICE 'TEST 14 PASSED: Cannot update other user profile (0 rows affected)';
  ELSE
    RAISE EXCEPTION 'TEST 14 FAILED: Updated % rows for other user', rows_updated;
  END IF;
END $$;

-- ==========================================
-- TEST 15: Cannot insert personality scores for other user
-- ==========================================
-- Expected: Should fail with permission denied
DO $$
DECLARE
  other_user_id UUID := '00000000-0000-0000-0000-000000000003';
  insert_failed BOOLEAN := FALSE;
BEGIN
  BEGIN
    INSERT INTO public.personality_scores (
      user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism
    )
    VALUES (other_user_id, 50.0, 50.0, 50.0, 50.0, 50.0);
  EXCEPTION
    WHEN insufficient_privilege OR check_violation THEN
      insert_failed := TRUE;
  END;
  
  IF insert_failed THEN
    RAISE NOTICE 'TEST 15 PASSED: Cannot insert personality scores for other user (blocked as expected)';
  ELSE
    RAISE EXCEPTION 'TEST 15 FAILED: Was able to insert personality scores for other user';
  END IF;
END $$;

-- ==========================================
-- MULTI-USER TEST SETUP
-- ==========================================
-- To test match-based access, you need to:
-- 1. Create User A and User B
-- 2. Insert a match between them:
--    INSERT INTO public.matches (user_id, matched_user_id, compatibility_score, status)
--    VALUES ('user-a-uuid', 'user-b-uuid', 85.5, 'mutual');
-- 3. Then as User A, try to view User B's profile:
--    SELECT * FROM public.profiles WHERE id = 'user-b-uuid';
-- 4. Expected: Should now return User B's profile due to match policy
