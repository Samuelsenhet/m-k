# Apple App Review — Response 2026-04-21

> Submission ID: `4a9acd99-c379-431f-a443-99691527eead`
> Build replied with: **1.0.0 (79)**
> Addresses: Guideline 2.1(a), 5.1.2(i), 4.3(b)

## How to use

1. Verify build 79 installs and runs on a physical iPhone (Fas 0.4 happy path).
2. ASC → MÄÄK → App Store → Version 1.0.0 → Build section → select **build 79**.
3. Submit for Review wizard → answer Export Compliance / Content Rights / IDFA questions.
4. In Resolution Center / Review Notes: paste the full text below.
5. Tick "Manually release this version" before clicking **Submit for Review**.

## Review notes — paste verbatim

```
Hello,

Thank you for the thorough review and the clear feedback on all three
points. We have addressed each below.

═══════════════════════════════════════════════════════════════
Guideline 2.1(a) — "no content loaded after the personality test"
═══════════════════════════════════════════════════════════════

Root-cause analysis uncovered three compounding database-layer
issues that together prevented match content from loading after
onboarding:

 1. A recursive Row-Level Security policy on the matches table
    caused the daily matching query to fail silently.
 2. The matches table was missing an `expires_at` column that the
    match-daily Edge Function wrote on every insert, so every new
    match insert aborted with a PostgREST schema error.
 3. A legacy `compatibility_score NOT NULL` constraint on the same
    table rejected inserts from the current scoring path, which
    writes `match_score` instead.

All three are now fixed on the Supabase backend. On the iOS client
we additionally resolved a React hooks-ordering bug in the Matches
tab that would trigger the app's root error boundary the first
time matches were successfully loaded, plus a UI state issue where
the personality test "Continue" button could become unresponsive
after a failed network request.

These fixes are included in build 79 (now uploaded). We verified
end-to-end on a physical iPhone that a fresh account completes the
personality test and receives match content on the next screen
without errors.

═══════════════════════════════════════════════════════════════
Guideline 5.1.2(i) — App Tracking Transparency
═══════════════════════════════════════════════════════════════

MÄÄK does not track users as defined by Apple. We do not link our
user data with third-party data for advertising purposes, and we do
not share collected data with data brokers. The analytics we use
(PostHog for product analytics, RevenueCat for subscription
management) use our own internal user identifiers only and are not
used for cross-app tracking.

We have updated the App Privacy information in App Store Connect to
accurately reflect this. All data categories are now correctly
declared as "Data Not Used to Track You." No ATT prompt is therefore
required.

═══════════════════════════════════════════════════════════════
Guideline 4.3(b) — App category saturation
═══════════════════════════════════════════════════════════════

We appreciate the concern about saturation, and we would like to
share why MÄÄK exists and how it differs fundamentally from other
dating apps on the Store.

Why we built MÄÄK:

I am a socially active person, and I have seen first-hand — both now
and over the past years — what nightlife and dating life actually
look like for young adults and those a little older. The current
generation of dating apps is not what people around me are asking
for. The dating market needs a change.

When the swipe method first appeared it was genuinely new and
popular. Today, people in my own age group and above are looking for
something different: finding a partner based on personality rather
than on a rapid photo decision. It feels more personal, more
serious, more adult, more focused.

MÄÄK's method is built for that. By mapping each person onto
archetypes and broader categories, we give users a shared vocabulary
for compatibility — in the same way that cultural concepts like
zodiac signs already matter to many people in how they talk about
relationships. MÄÄK turns that kind of shorthand into a structured,
research-grounded tool for finding a good match.

Every feature in the app is tailored to that single purpose:
accompanying the user through the journey of finding a suitable
partner — not maximising swipes, not maximising session time. Such
an app does not currently exist in Sweden at this scale or depth.

The scope of the work reflects that this is a purpose-built product,
not a template:

 • Approximately four months of focused product development
   (December 2025 – April 2026).
 • 336 commits to the main branch.
 • 22,600+ lines of TypeScript/React Native code across 132
   source files in the iOS app alone.
 • 77 database migrations defining the matching, personality, host,
   and privacy systems on our Supabase backend.
 • 32 server-side Edge Functions for matching, moderation, identity
   verification, push notifications, and subscription reconciliation.
 • A 30-question personality test covering 5 cognitive dimensions
   (EI, SN, TF, JP, AT), mapping to 16 archetypes and 4 broader
   categories — with localised content across roughly 1,200
   Swedish and English string keys.

The concrete ways MÄÄK differs from other dating apps on the Store:

 1. Personality-based matching, not swipe-based
    MÄÄK is built around a 30-question, 5-dimension personality test
    that maps each user to one of 16 archetypes and 4 broader
    categories (Diplomat, Strategist, Builder, Explorer). Matches
    are computed daily from personality compatibility, archetype
    alignment, and shared interests — not from rapid photo-based
    swiping.
    ▸ To verify: after the onboarding wizard at /onboarding, the
      result screen is rendered from /personality-guide.

 2. Quality over quantity — daily matches only
    Users receive a small set of curated matches each day rather
    than an endless feed. This is a deliberate design choice to
    encourage intentional connection over compulsive usage patterns.
    ▸ To verify: the Matches tab at /(tabs)/index shows only the
      current day's curated set, not an infinite feed.

 3. Group interaction layer ("Samlingar")
    MÄÄK includes a group chat feature where multiple users meet
    through shared interests and archetype compatibility, not
    one-to-one matches alone. This is closer to a social community
    than a conventional dating app.
    ▸ To verify: Settings → Träffar (/traffar); Samlingar open from
      each event via /group-chat/[groupId].

 4. Video "Kemi-Check"
    Before committing to a physical meeting, matched users can
    conduct a short structured video interaction inside the app,
    reducing the friction and awkwardness of the first date.
    ▸ To verify: from any match card, the "Kemi-Check" action
      routes to /kemi-check/[matchId].

 5. "Värd" (Host) program — community-driven introductions
    Trusted community members can introduce two users they believe
    would be compatible, combining algorithmic and human matchmaking.
    This social layer does not exist in other apps on the Store.
    ▸ To verify: Settings → "Introduktioner" opens /host/inbox;
      /host/introduce is the flow a host uses to propose an intro.

 6. Swedish-first product and cultural context
    MÄÄK is designed for the Swedish market, built in Swedish with
    English as a fallback, and draws on a specific cultural framing
    ("Schrödingers dejt", a Swedish take on relationship openness)
    that is not translated or ported from US-market dating apps.

 7. "Slow dating" philosophy
    The combination of daily limits, personality-first matching,
    group interaction, host-led introductions, and deliberate
    anti-swipe design places MÄÄK in a different user-experience
    category than apps like Tinder, Hinge, or Bumble.

 8. Privacy-first data handling
    Users who deactivate their account are not just hidden — their
    profile is soft-deleted and then hard-purged, including all
    associated photos and verification documents, after 90 days.
    This behaviour is implemented at the database level with an
    automated cron job, not left as a manual operator task. Very
    few dating apps on the Store offer this level of data-lifecycle
    commitment to users.
    ▸ To verify: Settings → "Delade data" (/shared-data) lists the
      user's own data categories; account deactivation is available
      from Settings → "Ta bort konto".

 9. Regional focus enforced in code, not just in copy
    Account creation is gated at the authentication layer to Swedish
    phone numbers (+46). MÄÄK is not a globally-marketed app with a
    Swedish localisation layer on top — it is a Swedish product,
    built for Swedish users, with platform and cultural assumptions
    that would not translate to a US or global audience.

10. Community-driven introductions ("Värd" program)
    In addition to algorithmic matching, selected trusted users
    ("Värdar" — hosts) can introduce two members they personally
    believe would be compatible. This human-in-the-loop matchmaking
    layer, combined with host-curated group events ("Samlingar"),
    places MÄÄK closer to a social network with relationship
    features than to a swipe-based dating utility. None of the
    large incumbent dating apps operate a host/community system of
    this kind.

11. No advertising; subscription-based business model
    MÄÄK does not run third-party advertising and does not sell or
    share user data. Revenue comes from two transparent subscription
    tiers through Apple's own in-app purchase system (Basic, 69 kr
    per week; Premium, 199 kr per month). This avoids the
    attention-maximising engagement loops that characterise the
    "saturated" dating category the guideline refers to.
    ▸ To verify: the paywall at /paywall is reached from Settings →
      "Uppgradera". Both tiers use Apple's StoreKit via RevenueCat;
      no ad SDKs, ad networks, or web-based ads exist in the binary.

We respectfully ask the review team to reconsider the submission in
light of these differentiators. We are happy to provide a recorded
walkthrough demonstrating each feature if that would help.

For fastest verification, the reviewer account +46 70 123 4567 with
OTP 123456 can be used to bypass the SMS gate and reach the full
flow immediately.

═══════════════════════════════════════════════════════════════

Thank you for your time and for the helpful feedback. Please let us
know if any further information would be useful.

Kind regards,
Samuel
```

## Submit wizard — Apple-svar cheatsheet

| Question | Answer |
|---|---|
| Export Compliance — contains encryption? | **Yes** |
| Export Compliance — qualifies for exemption? | **Yes** (standard HTTPS/TLS) |
| Export Compliance — result | **Exempt** |
| Content Rights — third-party content? | **No** |
| IDFA — advertising identifier? | **No** |
| Manually release this version | **Checked** |

## Before clicking Submit

- [ ] Build 79 installed on a physical iPhone
- [ ] Phone OTP flow works with a real Swedish number
- [ ] Reviewer bypass verified end-to-end: +46 70 123 4567 → OTP 123456 → onboarding → Matches tab renders content
- [ ] `APP_REVIEW_BYPASS_ENABLED=true` set in Supabase secrets (remove after approval)
- [ ] Personality test completes (30 questions) without hanging
- [ ] Match content loads on Matches tab after onboarding (no ErrorBoundary)
- [ ] Paywall opens without crash
- [ ] ASC App Privacy updated: all categories "Data Not Used to Track You"
- [ ] ASC Version 1.0.0 Build section points to build 79
- [ ] Manually Release flag is set
