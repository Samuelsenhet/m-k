# MÄÄK – Demo: Match system & Chat (fully working)

This guide explains how the **match system** and **chat** work, and how to run a **fully working demo** with two users, one mutual match, and sample messages.

---

## How the match system works

1. **Daily matches**  
   The app calls the `match-daily` Edge Function (with the logged-in user’s token). The function:
   - Reads the user’s profile and personality result from `profiles` and `personality_results`.
   - Finds other users (e.g. from the same “batch” or pool), compares personality/types, and builds a list of matches (similar + complementary).
   - Writes rows into the `matches` table (e.g. `pending`).
   - Returns these matches to the app.

2. **Like / Pass**  
   From **Matches** or **View match profile**, the user can **Like** or **Pass** a match. The app calls `match-status` (or updates `matches`), which:
   - Updates the match row (e.g. `liked`, `passed`, or `mutual` when both like).

3. **Mutual matches**  
   When both users have liked each other, the match `status` becomes `mutual`. Only mutual matches show up in **Chat** as conversations.

4. **Chat list**  
   The **Chat** page loads the conversation list by querying `matches` where `status = 'mutual'` and `user_id` or `matched_user_id` = current user. For each match it loads the other user’s profile (name, avatar) and the last message from `messages`.

So: **match system** = `match-daily` + `matches` (+ optional `match-status`). **Chat** = `matches` (mutual only) + `messages`.

---

## How chat works

1. **Conversation list**  
   `MatchList` fetches all mutual matches from `matches`, then for each match:
   - Loads the other user’s profile (display name, avatar, verification).
   - Loads the last message and unread count from `messages`.

2. **Opening a conversation**  
   When the user taps a match, the app opens `ChatWindow` for that `match_id` and `matched_user_id`:
   - Loads all messages for that `match_id` from `messages`.
   - Subscribes to Supabase Realtime for `messages` so new messages appear live.
   - User can send text; new rows are inserted into `messages`.

3. **Kemi-Check (video)**  
   From the chat toolbar, the user can start a video call (Kemi-Check). After ending the call, the app can show a post-video AI suggestion card (from the `ai-assistant` function, type `after_video`).

So: **chat** = `matches` (mutual) + `messages` (per `match_id`) + Realtime subscription.

---

## Running a fully working demo

To see matches and chat **without** running the real `match-daily` logic (e.g. no other users in the pool), you can **seed** two test users, one mutual match, and sample messages.

### 1. Create two test users in Supabase

- Go to **Supabase Dashboard** → **Authentication** → **Users**.
- **Add user** (or **Invite user**):
  - **User 1:** e.g. phone `+46700000001` or an email you can use to sign in.
  - **User 2:** e.g. phone `+46700000002` or another email.
- After creating them, copy each user’s **UUID** (e.g. `a1b2c3d4-...`).  
  You will use these as **Demo User 1** and **Demo User 2**.

### 2. Run the demo seed

- Open **`supabase/seed-demo.sql`**.
- At the top, replace the two placeholders with your real UUIDs:
  - `YOUR_DEMO_USER_1_UUID` → User 1’s UUID  
  - `YOUR_DEMO_USER_2_UUID` → User 2’s UUID  
  (including the quotes.)
- In Supabase: **SQL Editor** → paste the full script → **Run**.  
  If your project uses **RLS**, run the script with a role that can insert into `profiles`, `personality_results`, `matches`, and `messages` (e.g. service role, or a user that has the right policies).

The seed will:

- Upsert **profiles** for both users (Alex, Sara with bio, work, etc.).
- Insert **personality_results** (e.g. ENFJ, INFP).
- Insert one **mutual match** between User 1 and User 2.
- Insert **sample messages** for that match (short conversation).

### 3. Use the app as Demo User 1

- Log in to the app as **User 1** (e.g. with the phone number or email you used for that user).
- **Matches:** You should see **one mutual match** (Sara).
- **Chat:** Open **Chat**; you should see **one conversation** (Sara). Open it to see the **sample messages**.

That gives you a **fully working demo** of the match system and chat: one mutual match and a real conversation loaded from the database.

### 4. (Optional) Second device / browser

- Log in as **User 2** in another browser or device.
- User 2 will see one mutual match (Alex) and the same conversation; you can send new messages from both sides and see them via Realtime.

---

## If the seed script fails

- **Column names:** Your schema might use `compatibility_score` instead of `match_score`, or omit `composite_score` / `expires_at` / `match_date` / `is_first_day_match`. Edit the `INSERT INTO public.matches (...)` part of `seed-demo.sql` to match your actual columns (you can check in **Table Editor** or migrations).
- **Profiles:** If your `profiles` table has only `id` (no `user_id`), remove `user_id` from the profiles `INSERT` and keep only `id`.
- **RLS:** If you get permission errors, run the seed in the SQL Editor with **“Run as”** set to a role that bypasses RLS (e.g. service role), or temporarily relax policies for testing.

---

## Summary

| Goal                         | What to do                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Understand match system    | Read “How the match system works” and use `match-daily` + `matches`.      |
| Understand chat            | Read “How chat works” and use `matches` (mutual) + `messages` + Realtime.   |
| Run a full demo            | Create 2 users → replace UUIDs in `seed-demo.sql` → run script → log in as User 1. |
| Try two-sided conversation | Log in as User 2 in another browser and send messages from both sides.     |

After seeding, the app works end-to-end: **Matches** shows the mutual match, **Chat** shows the conversation and the sample messages, and you can send new messages and (if configured) use Kemi-Check and AI suggestions.
