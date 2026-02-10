# MÄÄK – How Features Work

Overview of how the main app features work end-to-end: matching, matches UI, video chat, AI assistant, ID verification, and buttons/icons.

---

## 0. E-post i projektet – var det finns + status

**Var e-post/e-mail förekommer i Cursor-projektet:**

| Plats | Användning |
|-------|------------|
| `supabase/functions/twilio-verify-otp/index.ts` | Placeholder-e-post `{telefon}@phone.maak.app` för Supabase Auth (krävs för magic link); ingen riktig utskick. |
| `supabase/functions/reset-demo-password/index.ts` | Tar emot `email` + `newPassword` och uppdaterar lösenord via Admin API; skickar **ingen** e-post. |
| `src/components/settings/ProfileSettings.tsx` | Visar `user.email` från Supabase Auth. |
| `src/components/chat/ChatWindow.tsx` | Visar initial från `user?.email` som fallback. |
| `src/pages/SignUp.tsx`, `src/pages/Login.tsx` | E-post/lösenord-inloggning (kan vara legacy om appen är telefon-only). |
| `src/contexts/AuthProvider.tsx`, `AuthContext.tsx` | `signIn`/`signUp` med e-post. |
| `src/pages/Terms.tsx` | Policytext: "meddelar dig via appen eller e-post". |
| `src/i18n/locales/*.json` | Texter om "pushnotiser och e-post", "Resend code" (OTP-återutsändning). |
| `src/components/onboarding/GdprOnboarding.tsx` | "Ta emot personliga erbjudanden och nyheter via e-post." |
| `supabase/config.toml` | Auth e-post/SMTP (kommenterad), inget används för utskick från appen. |

**Notiser idag:** `send-notification` (Edge Function) och triggern `notify_reporter_on_report_status` skriver till tabellen `notifications` och Realtime – **ingen e-post skickas**.

**Är dessa punkter klara?**

| Punkt | Status |
|-------|--------|
| **Integrera med Supabase för ärendehantering** | **Ja.** Rapporter/överklaganden i Supabase; vid ny rapport/överklagande anropas Edge Function `send-email` (Resend). Tabellerna `reports` och `appeals` har `email_sent`; `email_templates` och `email_logs` används för mallar och logg. |
| **Skicka riktiga e-postmeddelanden via API** | **Ja.** Edge Function `send-email` använder Resend API. Mallar: `report_received`, `report_resolved`, `appeal_received`, `appeal_decision`. Secrets: `RESEND_API_KEY`, valfritt `MAIL_FROM` (Supabase Dashboard). |
| **Admin-panel för e-posthantering** | **Ja.** `/admin/email` – moderatorer ser e-postmallar (Rapporter, Överklaganden), plats för "Skicka e-post", och **sändningsloggar** från `email_logs`. |

**E-postflöde (Resend):** (1) **Ny rapport:** Report.tsx insert → anropar `send-email` med `to` (user.email), `report_received`, `report_id`. (2) **Nytt överklagande:** Appeal.tsx insert → `send-email` med `to`, `appeal_received`, `appeal_id`. (3) **Rapport avslutad:** AdminReports vid status resolved/dismissed → `send-email` med `report_resolved`, `data: { report_id, status }` (ingen `to` – mottagare hämtas i Edge Function från `reports.reporter_id`). (4) **Beslut på överklagande:** AdminAppeals vid approved/rejected → `send-email` med `appeal_decision`, `data: { appeal_id, status }` (mottagare från `appeals.user_id`). Edge Function skickar via Resend, skriver till `email_logs`, sätter `reports.email_sent`/`appeals.email_sent`. Placeholder-adresser (`@phone.maak.app`) hoppas över. Secrets: `RESEND_API_KEY`, valfritt `MAIL_FROM`.

**Utökad e-post (Punkt 2):** `send-email` använder DB-mallar från `email_templates` (fallback till inbyggda), `last_used` uppdateras, tracking-pixel anropar `track-email` (sätter `opened_at`/`clicked_at`). `send-bulk-email` skickar kampanjer från `bulk_emails` till alla profiler med riktig e-post. **Deploy:** `supabase functions deploy send-email track-email send-bulk-email --no-verify-jwt`. **Test:** (1) Redigera mall i Admin → E-posthantering → Mallar; nästa rapport använder DB-innehållet. (2) Öppna skickat mail (bilder på); `email_logs.opened_at` sätts. (3) Skapa kampanj under Skicka → Skicka nu; endast användare med riktig e-post får mailet.

**Bulk-filter:** `profiles.country` (ISO alpha-2) används av `send-bulk-email` när kampanjen har `filters.country` (t.ex. SE, NO, DK). Uppskattat antal i admin använder samma filter.

**Valfria nästa steg:** Cron/jobb för schemalagda kampanjer (t.ex. Supabase Cron eller extern scheduler som anropar `send-bulk-email` för `status = 'scheduled'` och `scheduled_for <= now()`).

---

## 1. Matching Algorithm

**Where:** `src/lib/matching.ts`, Supabase Edge Function `match-daily`, and **`generate-match-pools`** (fills `user_daily_match_pools` from personality test data).

**Flow:**

1. **Pool generation (personality → pools):** The Edge Function **`generate-match-pools`** runs once per day (e.g. 00:00 CET, via cron). It reads `profiles` and `personality_results`, runs the same algorithm as `src/lib/matching.ts` (dealbreakers, 60/40 similar/complementary, repeat avoidance using yesterday’s matches), and writes one row per user into `user_daily_match_pools` for today. **Without this step, match-daily returns “Match pool not yet generated for today.”**
2. **Dealbreakers** – Age range, gender preferences, onboarding completed. Candidates that fail are filtered out.
3. **Composite score** – Each candidate is scored from:
   - **Personality similarity** (MBTI dimensions: ei, sn, tf, jp, at) – difference converted to 0–100% similarity.
   - **Archetype alignment** – How well archetypes/categories align.
   - **Interest overlap** – Shared interests.
4. **60/40 split** – The daily batch is built as ~60% **similar** (high personality similarity) and ~40% **complementary** (balanced opposites). Tie-breakers: interest overlap, then archetype.
5. **Repeat avoidance** – Prefer not to show the same person two days in a row if there are enough others.
6. **Delivery** – Free users get up to 5 matches per day; Plus/Premium get the full batch. Matches are stored in `matches` and delivered via the `match-daily` Edge Function.

**Relevant code:** `generateUserMatchPool`, `calculateCompositeScore`, etc. in `src/lib/matching.ts`; `supabase/functions/generate-match-pools/index.ts` (pool generation); `supabase/functions/match-daily/index.ts` (delivery).

---

## 2. How Matches Are Shown

**Matches page (`/matches`):**

- **Data:** `useMatches()` calls the `match-daily` Edge Function with the current user. Response includes `match_id`, `profile_id`, `display_name`, `compatibility_percentage`, `match_type` (similar/complementary), photos, archetype, etc.
- **UI:** Cards for each match with photo, name, archetype badge, match %, “Liknande” / “Kompletterande” badge. Like/Pass and “Chatta” (navigate to chat). First-match celebration when applicable.
- **Waiting phase:** If the user is in the 24h post-onboarding wait, `useMatchStatus()` shows a waiting message and countdown instead of cards.

**Chat match list:**

- **Data:** `MatchList` loads from `matches` where `status = 'mutual'`, then batch-fetches profiles (`display_name`, `avatar_url`, `id_verification_status`) and last message / unread counts.
- **UI:** List of mutual matches with avatar, name, last message preview, unread badge. Click opens `ChatWindow` for that match.

**Relevant code:** `src/pages/Matches.tsx`, `src/hooks/useMatches.ts`, `src/components/chat/MatchList.tsx`, `src/hooks/useMatchStatus.ts`.

---

## 3. Video Chat (FaceTime-style)

**Where:** `src/pages/Chat.tsx`, `src/components/chat/VideoChatWindow.tsx`, `IncomingCallNotification.tsx`.

**Flow:**

1. **Start call:** In a conversation, user taps “Starta videochatt”. `videoCallActive` is set; UI switches to `VideoChatWindow`.
2. **VideoChatWindow:** Uses `getUserMedia` for camera/mic, `RTCPeerConnection` for WebRTC. Signaling (offer/answer/ICE) is sent over Supabase Realtime (`useRealtime`, channel per `roomId` = match id).
3. **Incoming call:** Realtime channel `calls:{userId}` listens for `call_request` broadcast. On event, `IncomingCallNotification` shows caller name with Accept/Decline.
4. **Accept:** Sends accept over Realtime and opens `VideoChatWindow`. **Decline:** Dismisses notification.
5. **End call:** “End Call” closes peer connection, stops tracks, and calls `onEndCall()`.

**Relevant code:** `VideoChatWindow.tsx` (media + WebRTC), `Chat.tsx` (state, “Starta videochatt”, incoming-call handler), `IncomingCallNotification.tsx`, `useRealtime.ts`.

---

## 4. AI Assistant

**Where:** `src/components/ai/AIAssistantPanel.tsx`, Edge Function `ai-assistant`.

**Flow:**

1. **Panel:** User opens AI panel (e.g. from Matches). Types: “Full analysis”, “Matching tips”, “Profile tips”, optional “Icebreakers” for a specific match.
2. **Request:** Frontend calls `supabase.functions.invoke('ai-assistant', { body: { userId, type, matchedUserId? } })`. Auth token is sent automatically.
3. **Backend:** `ai-assistant` verifies user, loads profile and personality from Supabase, then calls Lovable AI gateway (e.g. Gemini) with a system + user prompt built from type. Returns a text suggestion.
4. **UI:** Suggestion is shown in the panel; errors (e.g. 429, 402) are surfaced.

**Related:** Icebreakers and follow-ups use `generate-icebreakers` and `generate-followups` Edge Functions (same AI gateway, different prompts).

**Relevant code:** `AIAssistantPanel.tsx`, `supabase/functions/ai-assistant/index.ts`, `ChatWindow.tsx` (icebreakers/followups).

---

## 5. Account Verification (ID / Passport)

**Where:** `src/components/onboarding/IdVerificationStep.tsx`, Edge Function `id-verification-webhook`, `profiles.id_verification_status`.

**Flow:**

1. **Upload:** User uploads front (and optionally back) of ID in `IdVerificationStep`. Images are validated (type/size) and uploaded to storage; profile is updated with paths and `id_verification_status: 'pending'`.
2. **Webhook:** An external provider (e.g. Onfido, Jumio) processes the document and sends a webhook to `id-verification-webhook`. The function parses status (`approved` / `rejected`), resolves `user_id` (from payload or `id_verification_applicants`), and updates `profiles.id_verification_status`.
3. **UI:** A **verified badge** (icon) is shown next to the user’s name when `id_verification_status === 'approved'` – in chat list, chat header, match profile view, and own profile.

**Relevant code:** `IdVerificationStep.tsx`, `supabase/functions/id-verification-webhook/index.ts`, `VerifiedBadge` component used in MatchList, ChatWindow, MatchProfileView, ProfileView.

---

## 6. Other Features (short)

- **Auth:** Phone (Twilio) OTP via `PhoneAuth` page and `twilio-send-otp` / `twilio-verify-otp`. Session is Supabase Auth.
- **Onboarding:** `OnboardingWizard` – steps include personality test, profile, photos, optional ID verification. Sets `onboarding_completed` and journey phase.
- **Realtime:** `useRealtime` – Supabase channel for a match/conversation; used for messages, typing, and call signaling.
- **Achievements:** `AchievementsContext` + `useAchievements`; toasts and panel; achievements like first match, first message, ID verified.
- **Navigation:** Bottom nav (Matches, Chat, Profile); routes in `App.tsx`; buttons use `Link` or `navigate()` and aria-labels where needed.

---

## 7. Buttons and Icons

- **Matches:** Like (heart), Pass (X), Chatta (message icon), AI panel button. All wired to `useMatches` and navigation.
- **Chat:** Back, send, icebreaker categories, AI icebreakers, follow-ups, “Starta videochatt”. Icons from `lucide-react` (MessageCircle, Brain, Send, etc.).
- **Profile:** Edit, Settings, photo upload. ID verification in onboarding.
- **Accessibility:** Important actions use `aria-label` (e.g. “Passa”, “Chatta”, “Tillbaka”). Buttons are focusable and keyboard-usable.

If something doesn’t work, check: (1) Supabase env and RLS, (2) Edge Function secrets and logs, (3) Realtime channels and auth, (4) that the user has completed onboarding and is in an allowed journey phase for that feature.

---

## 8. Kemi-Check & AI-Wingman (Videomöten & konversationsstart)

**What is included today**

- **Kemi-Check / Snabbvideo** – The in-app video call is branded as **Kemi-Check** (sv) / **Chemistry Check** (en) with subtitle **Snabbvideo 5–10 min**. It uses WebRTC via Supabase Realtime (no Daily.co). Start from chat toolbar ("Videochatt" / "Kemi-Check") or from the AI-Wingman prompt in chat.
- **AI-Wingman: boka videomöte** – When a conversation has **≥ 20 messages**, chat shows an AI-Wingman card: *"Verkar som ni har mycket gemensamt! Boka en Kemi-Check för att lära känna varandra bättre."* with **Starta Kemi-Check** and **Avbryt**. "Starta Kemi-Check" starts the video call and dismisses the card.
- **AI-isbrytare med personlighet** – Icebreakers are personality/archetype-based (generate-icebreakers, ai-assistant type icebreakers), with categories: Roligt, Djupt, Aktivitet, Komplimang, Blandad. They use both users' profiles and archetypes.
- **Förslag på svar (follow-ups)** – After 3+ messages, **Förslag på svar** suggests reply options (generate-followups). Shown when the last message is from the other person.
- **Icebreakers under videomötet** – VideoChatWindow shows icebreaker suggestions (Previous/Next) during the call.

**What is not (or only partly) included**

- **AI-Wingman under/efter videomötet** – No AI summary or topic suggestions during or after the video call (e.g. "Ni båda är extroverta och gillar resor – fråga om senaste resan!"). Could be added by calling the ai-assistant after onEndCall with context "after_video" and both profiles.
- **Bokning av tider** – No calendar/scheduling; video is start-now only. "AI hjälper till att hitta tider som passar båda" is not implemented.
- **Situationsbaserade isbrytare** – No explicit "efter videomöte" or "före date" icebreaker types. generate-icebreakers could be extended with a situation parameter (e.g. first_message | after_video | before_date) to tailor prompts.
- **Spontana frågor / 16-typer** – Icebreakers are already personlighetsmatchade (archetype/category). Distinct "spontana frågor" or "16-typer personlighetsmatchade frågor" as separate UI types are not implemented.
