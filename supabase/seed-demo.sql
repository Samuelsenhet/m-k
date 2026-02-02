-- =============================================================================
-- MÄÄK Demo Seed: Match system + Chat (fully working example)
-- =============================================================================
-- 1. Create 2 test users in Supabase: Authentication → Users → Add user
--    (e.g. two phone numbers or Invite user by email). Copy their UUIDs.
-- 2. Replace YOUR_DEMO_USER_1_UUID and YOUR_DEMO_USER_2_UUID below with those.
-- 3. Run this script in Supabase Dashboard → SQL Editor (run as yourself or
--    use a role that can insert into these tables; RLS may require service role).
-- =============================================================================

-- STEP 1: Replace these two UUIDs with your real auth user IDs
DO $$
DECLARE
  demo_user_1_id UUID := 'YOUR_DEMO_USER_1_UUID';
  demo_user_2_id UUID := 'YOUR_DEMO_USER_2_UUID';
  match_id_val UUID;
BEGIN
  -- 1) Profiles (upsert by id)
  INSERT INTO public.profiles (
    id, user_id, display_name, bio, date_of_birth, gender, looking_for,
    work, education, hometown, onboarding_completed, profile_completion,
    height, show_age, show_job, show_education, show_last_name
  )
  VALUES
    (demo_user_1_id, demo_user_1_id, 'Alex',
     'Gillar natur, läsa och fika. Söker någon att utforska livet med.',
     '1995-05-15', 'man', 'relation', 'UX-designer', 'KTH', 'Stockholm',
     true, 85, 178, true, true, true, true),
    (demo_user_2_id, demo_user_2_id, 'Sara',
     'Älskar resor och matlagning. Letar efter någon genuin och rolig.',
     '1994-08-22', 'kvinna', 'relation', 'Lärare', 'Lunds universitet', 'Malmö',
     true, 90, 165, true, true, true, true)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    looking_for = EXCLUDED.looking_for,
    work = EXCLUDED.work,
    education = EXCLUDED.education,
    hometown = EXCLUDED.hometown,
    onboarding_completed = EXCLUDED.onboarding_completed,
    profile_completion = EXCLUDED.profile_completion,
    height = EXCLUDED.height;

  -- 2) Personality results
  INSERT INTO public.personality_results (user_id, archetype, category, scores)
  VALUES
    (demo_user_1_id, 'ENFJ', 'DIPLOMAT', '{"ei": 55, "sn": 52, "tf": 58, "jp": 48, "at": 50}'::jsonb),
    (demo_user_2_id, 'INFP', 'DIPLOMAT', '{"ei": 45, "sn": 53, "tf": 62, "jp": 52, "at": 48}'::jsonb)
  ON CONFLICT (user_id) DO UPDATE SET
    archetype = EXCLUDED.archetype,
    category = EXCLUDED.category,
    scores = EXCLUDED.scores;

    -- 3) One mutual match
  -- If your table has compatibility_score instead of match_score, use that column name.
  INSERT INTO public.matches (
    user_id, matched_user_id, status, match_type, match_score,
    composite_score, match_date, expires_at, is_first_day_match
  )
  VALUES (
    demo_user_1_id, demo_user_2_id, 'mutual', 'similar', 88, 88,
    CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 day')::timestamptz, true
  )
  ON CONFLICT (user_id, matched_user_id) DO UPDATE SET
    status = 'mutual', match_type = EXCLUDED.match_type, match_score = EXCLUDED.match_score;

  SELECT id INTO match_id_val FROM public.matches
  WHERE user_id = demo_user_1_id AND matched_user_id = demo_user_2_id LIMIT 1;

  -- 4) Sample chat messages
  IF match_id_val IS NOT NULL THEN
    INSERT INTO public.messages (match_id, sender_id, content, message_type, is_read)
    VALUES
      (match_id_val, demo_user_1_id, 'Hej! Såg att vi matchade – gillar din profil.', 'text', true),
      (match_id_val, demo_user_2_id, 'Hej Alex! Tack, din med – UX och KTH, imponerande.', 'text', true),
      (match_id_val, demo_user_1_id, 'Tack! Vill gärna fika någon gång om du har tid.', 'text', true),
      (match_id_val, demo_user_2_id, 'Ja, gärna! Nästa vecka?', 'text', true),
      (match_id_val, demo_user_1_id, 'Perfekt, jag skriver till dig då 🙂', 'text', true);
  END IF;
END $$;

-- After running: log in as User 1 in the app. You should see 1 mutual match (Sara)
-- and a conversation with the sample messages above.
