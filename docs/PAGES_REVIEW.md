# MÄÄK – Page-by-page review

Overview of every route and what each page does and contains.

---

## Routes (from `App.tsx`)

| Path | Page component | Auth required? |
|------|----------------|-----------------|
| `/` | **Index** | Optional |
| `/phone-auth` | **PhoneAuth** | No — this is the login/signup page |
| `/onboarding` | **Onboarding** | Yes |
| `/profile` | **Profile** | Yes |
| `/matches` | **Matches** | Yes |
| `/chat` | **Chat** | Yes |
| `/match/:userId` | **ViewMatchProfile** | Yes |
| `/view-match` | **ViewMatchProfile** (query: `?match=`) | Yes |
| `*` | **NotFound** | No |

*Login.tsx and SignUp.tsx exist in `/src/pages/` but are not used in the router.*

---

## 1. Index (`/`)

**File:** `src/pages/Index.tsx`

**Purpose:** Home. Lets users discover the app, take the personality test, and see their result.

**Contains:**
- **States:** `landing` | `test` | `result` | `loading`
- **Landing:** `LandingPage` – hero, value prop, CTA to start the test
- **Test:** `PersonalityTest` – 30-question personality quiz; on complete saves to `personality_results` if logged in
- **Result:** `PersonalityResult` – shows archetype, category, scores; “existing result” message if they already had one
- **Logic:** If user is logged in, checks for existing `personality_results`; if found, shows result view. If not logged in or no result, shows landing. Start-test CTA can lead to test or (if already has result) a toast.

**SEO:** Helmet with title “MÄÄK - Personlighetsbaserad Dejting | Hitta Din Perfekta Matchning”, description, keywords, canonical.

---

## 2. Phone Auth (`/phone-auth`)

**File:** `src/pages/PhoneAuth.tsx`

**Purpose:** Sign in / sign up with Swedish mobile number and age verification.

**Contains:**
- **Steps (wizard):**
  1. **Phone** – `PhoneInput`, “Send code” → `sendOtp(phone)` (Twilio/Supabase)
  2. **Verify** – `OtpInput` (6 digits), “Verify” → `verifyOtp(phone, otp)`, resend with countdown
  3. **Profile** – `AgeVerification` (day/month/year). Must be 20+. On submit: upsert profile with `date_of_birth`, `phone`, `phone_verified_at` then redirect
- **Redirects:** If user exists and `onboarding_completed` → `/matches`; if `date_of_birth` but not onboarding → `/onboarding`; else stay for age step
- **UI:** Card with Heart icon, step titles/descriptions (i18n), progress dots, back to `/` from step 1

**Validation:** Zod for phone (Swedish mobile), OTP length, date of birth.

---

## 3. Onboarding (`/onboarding`)

**File:** `src/pages/Onboarding.tsx`

**Purpose:** New users complete profile and preferences after phone auth.

**Contains:**
- **Guard:** No user → `/phone-auth`; no `date_of_birth` → `/phone-auth`; already `onboarding_completed` → `/`
- **Flow:** `OnboardingWizard` (multi-step: display name, photos, gender, looking for, height, etc.). On complete → set `onboarding_completed`, then `WelcomeScreen` with display name and “Continue” → `/matches`
- **Loading:** Spinner while checking onboarding status

---

## 4. Profile (`/profile`)

**File:** `src/pages/Profile.tsx`

**Purpose:** Current user’s profile view, edit, settings, achievements, AI assistant, ID verification.

**Contains:**
- **Guard:** No user → `/phone-auth`
- **Main view:** `ProfileView` (full-screen) – photo, name, age, height (cm), bio, archetype, etc.; actions open sheets/overlays
- **Overlays/sheets:**
  - **Settings sheet:** Language toggle, notifications/privacy placeholders, “Achievements” (opens achievements panel), Log out, Delete account (AlertDialog)
  - **Verify ID sheet:** `IdVerificationStep` for users who skipped it in onboarding
  - **Achievements panel:** `AchievementsPanel` (list of achievements)
  - **AI assistant panel:** `AIAssistantPanel` (matching/profile/icebreakers/after_video tips)
  - **Edit:** `ProfileEditor` (form to update profile fields)
- **Bottom nav:** `BottomNav`
- **Data:** Fetches `personality_results` for archetype; `ProfileView` / `ProfileEditor` load profile from Supabase

---

## 5. Matches (`/matches`)

**File:** `src/pages/Matches.tsx`

**Purpose:** Daily matches (pending + mutual), filter by type, like/pass, first-match celebration.

**Contains:**
- **Guard:** No user → `/phone-auth`
- **Match status:** If `matchStatus.journey_phase === 'WAITING'` → `WaitingPhase` (countdown to next batch) instead of list
- **Header:** “Dagens matchningar”, “24h löpande • Kvalitetsfokus”, Brain (AI panel), Refresh
- **Info card:** “Smart Personlighetsanalys” – counts of similar vs complementary pending matches
- **AI panel:** Collapsible `AIAssistantPanel` (matching tips)
- **Profile completion:** `ProfileCompletionPrompt` if profile incomplete
- **Mutual matches:** Section “Ömsesidiga matchningar (N)” with cards: photo, name, archetype, “Chatta” → `/chat?match=<id>`
- **Pending matches:** Tabs – **Alla** | **Likhets** (similar) | **Motsats** (complementary). Cards show photo (or archetype emoji), name, category badge, “Se profil” → `/view-match?match=<id>`. Like/Pass on `ViewMatchProfile` or from card actions
- **First match:** `FirstMatchCelebration` overlay when first mutual match appears; achievement `first_match` when mutual count ≥ 1
- **Empty:** Message when no pending matches
- **Bottom nav:** `BottomNav`

**Data:** `useMatches()` (match-daily, match-status), `useMatchStatus()`.

---

## 6. Chat (`/chat`)

**File:** `src/pages/Chat.tsx`

**Purpose:** List of conversations and MSN-style chat with a selected match; optional video call (Kemi-Check).

**Contains:**
- **Guard:** No user → `/phone-auth`
- **URL:** `?match=<matchId>` can pre-select a conversation
- **Two layouts:**
  1. **No selection:** Header “Dina konversationer” (i18n), `MatchList` (cards for each mutual match), `CallHistoryDisplay` (recent calls), bottom nav when no selection
  2. **Selection:** `ChatWindow` for that match (title “Chatt med: [name]”, toolbar, messages, input, avatar panels) or, if video active, `VideoChatWindow` (Kemi-Check)
- **ChatWindow props:** matchId, matchedUserId, name, avatar, verified, icebreakers, onBack, onStartVideo, showPostVideoCard, onDismissPostVideoCard
- **Post–Kemi-Check:** When user ends video, `showPostVideoCard` is set; ChatWindow shows AI “after_video” suggestion card (summary + follow-up topics), then dismiss
- **Incoming call:** If `incomingCall` is set, `IncomingCallNotification` (accept/decline) is shown instead
- **Call log:** Local state `callLogs` (completed/missed/outgoing); displayed under conversation list

**Data:** Match list and selected match profile loaded from Supabase; messages via Supabase realtime.

---

## 7. View Match Profile (`/match/:userId`, `/view-match?match=...`)

**File:** `src/pages/ViewMatchProfile.tsx`

**Purpose:** Full-screen profile of one match (from Matches or Chat) with Like / Pass.

**Contains:**
- **Route params:** `userId` from `/match/:userId`; or `match` from query → fetch match row to get `matched_user_id` for current user
- **Loading:** Spinner while `loading` or `!matchedUserId`
- **Content:** `MatchProfileView` – photo(s), name, age, height (cm), bio, work, education, archetype, etc.; Back, Like, Pass. Like/Pass call `likeMatch(matchId)` / `passMatch(matchId)` then navigate to `/matches`

**Data:** `MatchProfileView` loads profile by `userId`; `matchId` used for like/pass.

---

## 8. NotFound (`*`)

**File:** `src/pages/NotFound.tsx`

**Purpose:** 404 for unknown routes.

**Contains:**
- Logs path to console
- Centered: “404”, “Oops! Page not found”, link “Return to Home” → `/`

---

## Summary table

| Page        | Main role                         | Key components / features                          |
|------------|------------------------------------|----------------------------------------------------|
| **Index**  | Landing + test + result            | LandingPage, PersonalityTest, PersonalityResult   |
| **PhoneAuth** | Login / signup + age             | PhoneInput, OtpInput, AgeVerification              |
| **Onboarding** | Post-signup profile completion  | OnboardingWizard, WelcomeScreen                   |
| **Profile**   | My profile, settings, achievements | ProfileView, ProfileEditor, Settings, Achievements, AI |
| **Matches**   | Daily matches, like/pass, chat link | Match cards, tabs, AI panel, WaitingPhase, celebration |
| **Chat**      | Conversations + MSN-style chat   | MatchList, ChatWindow, VideoChatWindow, post-video AI |
| **ViewMatchProfile** | One match profile, like/pass | MatchProfileView                                   |
| **NotFound**  | 404                               | Message + link home                               |

All authenticated pages (Onboarding, Profile, Matches, Chat, ViewMatchProfile) redirect to `/phone-auth` when the user is not logged in.
