/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  type ArchetypeCode,
  type DimensionKey,
  type DrivingDimension,
  type MatchSubtype,
  type SignalBreakdown,
  buildDrivingDimensions,
  classifyMatchSubtype,
  computeCompositeScore,
  cosineSimilarity,
  geoScore,
  getPairLabel,
  getPairScore,
  interestOverlap,
  weightedDistance,
  balanceBatch,
  VALIDATION_DIVERGENCE_THRESHOLD,
} from "../_shared/match_math.ts";

import {
  buildCacheKey,
  generateMatchPayload,
  type MatchContext,
  type MatchPayload,
  type MatchPayloadOutput,
} from "../_shared/llm.ts";

import {
  fetchUserSignals,
  type UserSignalsLite,
} from "../_shared/embeddings.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://maakapp.se";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * MONSTER_MATCH_ENABLED gates the synthesis-layer scoring (embedding similarity
 * + LLM judgment in the composite formula). Default off so deploys are safe
 * while Build 80 is in App Review — the function still runs the v1 composite,
 * still calls the LLM for stories/icebreakers/validation, but the new score
 * components stay null and computeCompositeScore falls back to v1 weights.
 *
 * Flip: `supabase secrets set MONSTER_MATCH_ENABLED=true`. Step 3d wires up
 * the user_signals fetch and cosine similarity that this flag enables.
 */
const MONSTER_MATCH_ENABLED =
  (Deno.env.get("MONSTER_MATCH_ENABLED") ?? "false").toLowerCase() === "true";

// ---------- types ----------

type PersonalityCategory = "DIPLOMAT" | "STRATEGER" | "BYGGARE" | "UPPTÄCKARE";

interface PersonalityScores {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
  at: number;
}

interface MatchCandidate {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  category: PersonalityCategory;
  archetype: ArchetypeCode;
  scores: PersonalityScores;
  bio?: string;
  age?: number;
  gender?: string;
  interests?: string[];
  onboardingCompleted?: boolean;
}

interface UserProfile extends MatchCandidate {
  minAge?: number;
  maxAge?: number;
  interestedIn?: string;
  locale: "sv" | "en";
}

/** Output shape stored in user_daily_match_pools.candidates_data. */
interface MonsterPoolCandidate {
  // Backwards-compatible fields (read by existing match-daily) ----
  user: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    age?: number;
    archetype?: string;
    photos?: string[];
    bio?: string;
  };
  /** Subtype is one of three values; old clients see "growth" as unfamiliar. */
  matchType: MatchSubtype;
  /** Composite score 0–100. */
  matchScore: number;
  /** Per-dimension breakdown (legacy shape — derived from drivingDimensions). */
  dimensionBreakdown: Array<{
    dimension: string;
    score: number;
    alignment: "high" | "medium" | "low";
    description: string;
  }>;
  archetypeScore: number;
  anxietyScore: number;
  /** LLM-generated icebreakers. Empty until Fas 3 wires generate-icebreakers through the cache. */
  icebreakers: string[];
  /** Mirrored from matchStory for old clients. */
  personalityInsight: string;
  commonInterests: string[];

  // Monster Match v1 additions ----
  matchStory: string;
  matchSubtype: MatchSubtype;
  drivingDimensions: DrivingDimension[];
  archetypePair: { their: ArchetypeCode; yours: ArchetypeCode; pair_score: number; label: string };
  signalBreakdown: SignalBreakdown;
  llmDimensionBreakdown: Array<{ dim: DimensionKey; text: string }>;
  validationScore: number;
  validationNote: string;
  fallbackUsed: boolean;
  notableFacts: string[];
}

// ---------- dealbreakers + helpers ----------

function passesDealbreakers(user: UserProfile, candidate: MatchCandidate): boolean {
  if (candidate.onboardingCompleted === false) return false;
  if (user.minAge != null && user.maxAge != null && candidate.age != null) {
    if (candidate.age < user.minAge || candidate.age > user.maxAge) return false;
  }
  if (user.interestedIn && user.interestedIn !== "all" && candidate.gender) {
    const genderMap: Record<string, string[]> = {
      men: ["male", "man"],
      women: ["female", "woman"],
      all: ["male", "female", "man", "woman", "non-binary", "other"],
    };
    const allowed = genderMap[user.interestedIn] || genderMap["all"];
    if (!allowed.includes(candidate.gender.toLowerCase())) return false;
  }
  return true;
}

function ageFromDob(dob: string | null): number | undefined {
  if (!dob) return undefined;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18 ? age : undefined;
}

function calculateAnxietyReduction(s1: PersonalityScores, s2: PersonalityScores): number {
  const avgEnergy = (s1.ei + s2.ei) / 2;
  const tfDiff = Math.abs(s1.tf - s2.tf);
  return Math.min(100, Math.round(avgEnergy + (100 - tfDiff) / 4));
}

function findCommonInterests(a: string[], b: string[]): string[] {
  if (!a.length || !b.length) return [];
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

const DIM_ALIGNMENT_DESC_SV: Record<"similar" | "complementary", string> = {
  similar: "Likhet på den här dimensionen — ni ser den världen lika",
  complementary: "Olikhet på den här dimensionen — kan komplettera om ni vågar",
};

/** Convert Monster Match driving dimensions to legacy DimensionBreakdown shape. */
function toLegacyDimensionBreakdown(driving: DrivingDimension[]): MonsterPoolCandidate["dimensionBreakdown"] {
  return driving.slice(0, 3).map((d) => ({
    dimension: d.dim,
    score: 100 - Math.abs(d.your - d.their),
    alignment: d.impact,
    description: DIM_ALIGNMENT_DESC_SV[d.alignment],
  }));
}

function buildNotableFacts(
  user: UserProfile,
  candidate: MatchCandidate,
): string[] {
  const facts: string[] = [];
  if (user.age && candidate.age && Math.abs(user.age - candidate.age) <= 2) {
    facts.push(`båda omkring ${user.age} år`);
  }
  if (candidate.archetype && user.archetype === candidate.archetype) {
    facts.push("samma arketyp");
  }
  return facts;
}

// ---------- Monster Match scoring ----------

interface ScoredCandidate {
  candidate: MatchCandidate;
  payload: MatchPayload;
  composite: { total: number; breakdown: SignalBreakdown };
  subtype: MatchSubtype;
}

function scoreCandidate(
  user: UserProfile,
  candidate: MatchCandidate,
): ScoredCandidate {
  const subtype = classifyMatchSubtype(user.scores, candidate.scores);
  const personality = weightedDistance(
    user.scores,
    candidate.scores,
    subtype === "complementary" ? "complementary" : "similar",
  );
  const archetype = getPairScore(user.archetype, candidate.archetype);
  const interests = interestOverlap(user.interests, candidate.interests);
  const geo = geoScore(user.age, candidate.age);

  const composite = computeCompositeScore({
    personality,
    archetype,
    interests,
    geo,
    subtype,
  });

  const drivingDimensions = buildDrivingDimensions(user.scores, candidate.scores);
  const sharedInterests = findCommonInterests(user.interests ?? [], candidate.interests ?? []);

  const payload: MatchPayload = {
    user_id: candidate.userId,
    raw_score: composite.total,
    match_subtype: subtype,
    driving_dimensions: drivingDimensions,
    archetype_pair: {
      their: candidate.archetype,
      yours: user.archetype,
      pair_score: archetype,
      label: getPairLabel(archetype),
    },
    signal_breakdown: composite.breakdown,
    shared_interests: sharedInterests,
    notable_facts: buildNotableFacts(user, candidate),
  };

  return { candidate, payload, composite, subtype };
}

// ---------- LLM enrichment per candidate ----------

// Loose Supabase client surface — we only call .from(table).select/.insert/.upsert/.update.
// The full @supabase/supabase-js types pull in too much for a local helper alias.
type SupabaseClient = ReturnType<typeof createClient>;

interface CacheRow {
  cache_key: string;
  story: string;
  breakdown: Array<{ dim: DimensionKey; text: string }>;
  icebreakers: string[];
  validation_score: number | null;
  validation_note: string | null;
  hit_count: number;
}

async function readCachedStory(
  supabase: SupabaseClient,
  cacheKey: string,
): Promise<CacheRow | null> {
  const { data } = await supabase
    .from("match_story_cache")
    .select("cache_key, story, breakdown, icebreakers, validation_score, validation_note, hit_count")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  return (data as CacheRow | null) ?? null;
}

async function writeCachedStory(
  supabase: SupabaseClient,
  cacheKey: string,
  output: MatchPayloadOutput,
  locale: "sv" | "en",
): Promise<void> {
  await supabase.from("match_story_cache").upsert(
    {
      cache_key: cacheKey,
      story: output.story,
      breakdown: output.dimension_breakdown,
      icebreakers: output.icebreakers,
      validation_score: output.validation_score,
      validation_note: output.validation_note,
      locale,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );
}

async function bumpCacheHit(supabase: SupabaseClient, row: CacheRow): Promise<void> {
  await supabase
    .from("match_story_cache")
    .update({
      hit_count: (row.hit_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("cache_key", row.cache_key);
}

async function logValidationDivergence(
  supabase: SupabaseClient,
  args: {
    mathScore: number;
    llmScore: number;
    archetype_pair: string;
    match_subtype: MatchSubtype;
  },
): Promise<void> {
  const divergence = Math.abs(args.llmScore - args.mathScore);
  if (divergence <= VALIDATION_DIVERGENCE_THRESHOLD) return;
  await supabase.from("match_validation_flags").insert({
    math_score: args.mathScore,
    llm_score: args.llmScore,
    divergence,
    archetype_pair: args.archetype_pair,
    match_subtype: args.match_subtype,
  });
}

interface LlmStats {
  cache_hits: number;
  cache_misses: number;
  fallback_used: number;
  divergent: number;
}

async function enrichWithLlm(
  supabase: SupabaseClient,
  user: UserProfile,
  scored: ScoredCandidate,
  stats: LlmStats,
): Promise<{ output: MatchPayloadOutput; fallbackUsed: boolean }> {
  const context: MatchContext = {
    payload: scored.payload,
    viewer_archetype: user.archetype,
    viewer_display_name: user.displayName,
    candidate_display_name: scored.candidate.displayName,
    candidate_bio: scored.candidate.bio ?? null,
    locale: user.locale,
  };

  const cacheKey = buildCacheKey(context);
  const cached = await readCachedStory(supabase, cacheKey);

  if (cached) {
    stats.cache_hits++;
    await bumpCacheHit(supabase, cached);
    return {
      output: {
        story: cached.story,
        dimension_breakdown: cached.breakdown,
        icebreakers: (cached.icebreakers ?? []).slice(0, 3) as [string, string, string],
        validation_score: cached.validation_score ?? scored.composite.total,
        validation_note: cached.validation_note ?? "",
      },
      fallbackUsed: false,
    };
  }

  stats.cache_misses++;
  const result = await generateMatchPayload(context);
  if (result.fallback_used) {
    stats.fallback_used++;
  } else {
    await writeCachedStory(supabase, cacheKey, result.output, user.locale);
  }

  // Divergence flagging — only meaningful when the LLM actually scored.
  if (!result.fallback_used) {
    const divergence = Math.abs(result.output.validation_score - scored.composite.total);
    if (divergence > VALIDATION_DIVERGENCE_THRESHOLD) stats.divergent++;
    await logValidationDivergence(supabase, {
      mathScore: scored.composite.total,
      llmScore: result.output.validation_score,
      archetype_pair: `${user.archetype}-${scored.candidate.archetype}`,
      match_subtype: scored.subtype,
    });
  }

  return { output: result.output, fallbackUsed: result.fallback_used };
}

// ---------- synthesis helpers (Monster Match v1) ----------

/**
 * Average the cosine similarity of bio_embedding and answers_embedding pairs
 * into a single 0-100 score. Falls back to neutral 50 when both embeddings
 * are missing on either side. When only one of bio/answers is present, that
 * one carries the score.
 */
function pairEmbeddingSimilarity(
  a: UserSignalsLite | undefined,
  b: UserSignalsLite | undefined,
): number {
  if (!a || !b) return 50;
  const sims: number[] = [];
  if (a.bio_embedding && b.bio_embedding) {
    sims.push(cosineSimilarity(a.bio_embedding, b.bio_embedding));
  }
  if (a.answers_embedding && b.answers_embedding) {
    sims.push(cosineSimilarity(a.answers_embedding, b.answers_embedding));
  }
  if (sims.length === 0) return 50;
  return Math.round(sims.reduce((s, n) => s + n, 0) / sims.length);
}

// ---------- per-user pool generation ----------

const BATCH_SIZE = 10;
const LLM_PARALLEL_CHUNK = 4;

async function generateUserPool(
  supabase: SupabaseClient,
  user: UserProfile,
  candidates: MatchCandidate[],
  previousMatchedIds: string[],
  blockedPairs: Set<string>,
  photosByUserId: Map<string, string[]>,
  stats: LlmStats,
): Promise<MonsterPoolCandidate[]> {
  // Filter eligibility
  const others = candidates.filter((c) => c.userId !== user.userId);
  const eligible = others.filter((c) => passesDealbreakers(user, c));
  const unblocked = eligible.filter((c) => !blockedPairs.has(`${user.userId}:${c.userId}`));
  const prevSet = new Set(previousMatchedIds);
  const fresh = unblocked.filter((c) => !prevSet.has(c.userId));
  const pool = fresh.length >= BATCH_SIZE ? fresh : fresh.length > 0 ? fresh : unblocked;
  if (pool.length === 0) return [];

  // Score every candidate (math only)
  const scored = pool.map((c) => scoreCandidate(user, c));

  // Balance batch towards 50/35/15
  const balanced = balanceBatch(
    scored.map((s) => ({ candidate: s, subtype: s.subtype, score: s.composite.total })),
    BATCH_SIZE,
  );

  // Enrich each picked candidate with LLM (parallel chunks).
  const picked = balanced.map((b) => b.candidate);
  const enriched: Array<{ scored: ScoredCandidate; output: MatchPayloadOutput; fallbackUsed: boolean }> = [];
  for (let i = 0; i < picked.length; i += LLM_PARALLEL_CHUNK) {
    const chunk = picked.slice(i, i + LLM_PARALLEL_CHUNK);
    const results = await Promise.all(
      chunk.map((s) => enrichWithLlm(supabase, user, s, stats).then((r) => ({ scored: s, ...r }))),
    );
    enriched.push(...results);
  }

  // Synthesis layer: recompute composite with embedding similarity + LLM
  // judgment (validation_score). Subtype balance was preserved by the math-only
  // balanceBatch above; here we only refine the per-pair score that lands in
  // matches.match_score and matches.signal_breakdown.
  if (MONSTER_MATCH_ENABLED && enriched.length > 0) {
    const userSignal = (await fetchUserSignals(supabase, [user.userId])).get(user.userId);
    const candSignals = await fetchUserSignals(
      supabase,
      enriched.map((e) => e.scored.candidate.userId),
    );

    for (const e of enriched) {
      const candSignal = candSignals.get(e.scored.candidate.userId);
      const embSim = pairEmbeddingSimilarity(userSignal, candSignal);
      const llmJudge = e.fallbackUsed ? null : e.output.validation_score;

      const synth = computeCompositeScore({
        personality: e.scored.composite.breakdown.personality,
        archetype: e.scored.composite.breakdown.archetype_pair,
        interests: e.scored.composite.breakdown.interests,
        geo: e.scored.composite.breakdown.geo,
        subtype: e.scored.subtype,
        embedding_similarity: embSim,
        llm_judgment: llmJudge,
      });

      e.scored.composite = synth;
      e.scored.payload.raw_score = synth.total;
      e.scored.payload.signal_breakdown = synth.breakdown;
    }

    // Re-sort within the picked batch by synthesis score so the best-fit
    // synthesis match leads. (Subtype quotas are unchanged — they were
    // enforced earlier on the math composite.)
    enriched.sort((a, b) => b.scored.composite.total - a.scored.composite.total);
  }

  return enriched.map(({ scored, output, fallbackUsed }) => {
    const candidate = scored.candidate;
    return {
      user: {
        userId: candidate.userId,
        displayName: candidate.displayName,
        avatarUrl: candidate.avatarUrl,
        age: candidate.age,
        archetype: candidate.archetype,
        photos: photosByUserId.get(candidate.userId) || [],
        bio: candidate.bio,
      },
      matchType: scored.subtype,
      matchScore: scored.composite.total,
      dimensionBreakdown: toLegacyDimensionBreakdown(scored.payload.driving_dimensions),
      archetypeScore: scored.payload.archetype_pair.pair_score,
      anxietyScore: calculateAnxietyReduction(user.scores, candidate.scores),
      icebreakers: output.icebreakers,
      personalityInsight: output.story,
      commonInterests: scored.payload.shared_interests,
      matchStory: output.story,
      matchSubtype: scored.subtype,
      drivingDimensions: scored.payload.driving_dimensions,
      archetypePair: scored.payload.archetype_pair,
      signalBreakdown: scored.composite.breakdown,
      llmDimensionBreakdown: output.dimension_breakdown,
      validationScore: output.validation_score,
      validationNote: output.validation_note,
      fallbackUsed,
      notableFacts: scored.payload.notable_facts,
    };
  });
}

// ---------- HTTP handler ----------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Optional per-user on-demand generation. When match-daily sees an empty
  // pool for a just-onboarded user (cron only runs 23:00 UTC), it POSTs
  // { user_id } here so we build that user's pool immediately instead of
  // regenerating every pool in the system.
  let targetUserId: string | null = null;
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        const body = JSON.parse(raw) as { user_id?: unknown };
        if (typeof body.user_id === "string" && body.user_id.length > 0) {
          targetUserId = body.user_id;
        }
      }
    } catch {
      // Malformed body — treat as cron-mode (regenerate all).
    }
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });

    // 1. Fetch profiles eligible for matching.
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, user_id, display_name, avatar_url, date_of_birth, gender, min_age, max_age, interested_in, looking_for, onboarding_completed, bio",
      )
      .eq("onboarding_completed", true)
      .eq("is_visible", true)
      .or("deactivated_at.is.null,deactivation_hidden.eq.false");

    if (profilesError) {
      console.error("Profiles error:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles", message: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: personalityRows, error: persError } = await supabase
      .from("personality_results")
      .select("user_id, scores, archetype, category");

    if (persError) {
      console.error("Personality error:", persError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch personality results", message: persError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const personalityByUserId = new Map(
      (personalityRows || []).map((r: { user_id: string; scores: unknown; archetype: string | null; category: string }) => [
        r.user_id,
        {
          scores: (r.scores || {}) as PersonalityScores,
          archetype: (r.archetype || "INFJ") as ArchetypeCode,
          category: r.category as PersonalityCategory,
        },
      ]),
    );

    const profileIdToAuthId = new Map<string, string>();
    const candidatesList: MatchCandidate[] = [];

    for (const p of profiles || []) {
      const pid = p.id as string;
      const authId = (p as { user_id?: string }).user_id ?? pid;
      profileIdToAuthId.set(pid, authId);

      const pers = personalityByUserId.get(authId) || personalityByUserId.get(pid);
      if (!pers) continue;

      const scores = pers.scores as PersonalityScores;
      if (
        typeof scores.ei !== "number" ||
        typeof scores.sn !== "number" ||
        typeof scores.tf !== "number" ||
        typeof scores.jp !== "number" ||
        typeof scores.at !== "number"
      ) {
        continue;
      }

      const age = ageFromDob(p.date_of_birth as string | null);
      candidatesList.push({
        userId: pid,
        displayName: (p.display_name as string) || "Anonym",
        avatarUrl: (p.avatar_url as string) || undefined,
        category: pers.category,
        archetype: pers.archetype,
        scores,
        bio: (p.bio as string) || undefined,
        age,
        gender: (p.gender as string) || undefined,
        interests: typeof p.interested_in === "string" && p.interested_in.trim()
          ? p.interested_in.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        onboardingCompleted: p.onboarding_completed === true,
      });
    }

    if (candidatesList.length < 2) {
      return new Response(
        JSON.stringify({ date: today, users_processed: 0, message: "Not enough users with personality results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // 2. Bidirectional blocked pairs.
    const { data: blockedRows } = await supabase
      .from("blocked_users")
      .select("blocker_id, blocked_id");

    const blockedPairs = new Set<string>();
    for (const row of blockedRows || []) {
      const a = (row as { blocker_id: string }).blocker_id;
      const b = (row as { blocked_id: string }).blocked_id;
      blockedPairs.add(`${a}:${b}`);
      blockedPairs.add(`${b}:${a}`);
    }

    // 3. Recent match ids per user (7-day repeat-fatigue window).
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });
    const { data: recentMatches } = await supabase
      .from("matches")
      .select("user_id, matched_user_id")
      .gte("match_date", sevenDaysAgo);

    const previousByUser = new Map<string, string[]>();
    for (const row of recentMatches || []) {
      const uid = (row as { user_id: string }).user_id;
      const mid = (row as { matched_user_id: string }).matched_user_id;
      if (!previousByUser.has(uid)) previousByUser.set(uid, []);
      previousByUser.get(uid)!.push(mid);
    }

    // 4. Profile photos for candidates.
    const { data: photosRows } = await supabase
      .from("profile_photos")
      .select("user_id, storage_path, display_order")
      .in("user_id", candidatesList.map((c) => c.userId))
      .order("display_order", { ascending: true });

    const photosByUserId = new Map<string, string[]>();
    for (const row of photosRows || []) {
      const uid = (row as { user_id: string }).user_id;
      const path = (row as { storage_path: string }).storage_path;
      const bucket = "profile-photos";
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const url = urlData?.publicUrl ?? path;
      if (!photosByUserId.has(uid)) photosByUserId.set(uid, []);
      photosByUserId.get(uid)!.push(url);
    }

    // 5. Generate per-user pool.
    type ProfileRow = { id: string; min_age?: number; max_age?: number; interested_in?: string; looking_for?: string };
    const getProfile = (userId: string) => (profiles || []).find((p: { id: string }) => p.id === userId) as ProfileRow | undefined;

    const stats: LlmStats = { cache_hits: 0, cache_misses: 0, fallback_used: 0, divergent: 0 };
    let inserted = 0;
    let skipped = 0;

    for (const c of candidatesList) {
      if (targetUserId && c.userId !== targetUserId) continue;

      const profileRow = getProfile(c.userId);
      const user: UserProfile = {
        ...c,
        minAge: profileRow?.min_age ?? undefined,
        maxAge: profileRow?.max_age ?? undefined,
        interestedIn: profileRow?.interested_in ?? profileRow?.looking_for ?? undefined,
        // TODO: read profiles.preferred_language once column exists; default Swedish.
        locale: "sv",
      };
      const recipientAuthId = profileIdToAuthId.get(user.userId) ?? user.userId;
      const previousMatchedIds = previousByUser.get(recipientAuthId) || [];

      const candidates = await generateUserPool(
        supabase,
        user,
        candidatesList,
        previousMatchedIds,
        blockedPairs,
        photosByUserId,
        stats,
      );

      if (candidates.length === 0) {
        skipped++;
        continue;
      }

      const { error: insertErr } = await supabase
        .from("user_daily_match_pools")
        .upsert(
          {
            user_id: recipientAuthId,
            pool_date: today,
            candidates_data: candidates,
          },
          { onConflict: "user_id,pool_date" },
        );
      if (insertErr) {
        console.error("Pool insert error for", user.userId, insertErr);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        date: today,
        users_processed: inserted,
        users_skipped: skipped,
        total_eligible: candidatesList.length,
        batch_size: BATCH_SIZE,
        llm: stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("generate-match-pools error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
