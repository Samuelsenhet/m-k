/// <reference types="https://deno.land/x/types/index.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- Matching algorithm (ported from src/lib/matching.ts) ---
type DimensionKey = "ei" | "sn" | "tf" | "jp" | "at";
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
  archetype?: string;
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
}

interface DimensionBreakdown {
  dimension: string;
  score: number;
  alignment: "high" | "medium" | "low";
  description: string;
}

interface MatchResult {
  user: MatchCandidate;
  matchType: "similar" | "complementary";
  matchScore: number;
  compositeScore: number;
  dimensionBreakdown?: DimensionBreakdown[];
  archetypeScore?: number;
  anxietyScore?: number;
}

const SCORE_SIGNALS = { PERSONALITY_SIMILARITY: 0.4, ARCHETYPE_ALIGNMENT: 0.3, INTEREST_OVERLAP: 0.3 };
const MATCH_RATIO = { SIMILAR: 0.6, COMPLEMENTARY: 0.4 };
const DIMENSIONS: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];

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

function calculateSimilarityScore(s1: PersonalityScores, s2: PersonalityScores): number {
  let totalDiff = 0;
  DIMENSIONS.forEach((dim) => {
    totalDiff += Math.abs(s1[dim] - s2[dim]);
  });
  return Math.round(((500 - totalDiff) / 500) * 100);
}

function calculateComplementaryScore(s1: PersonalityScores, s2: PersonalityScores): number {
  const similarDims: DimensionKey[] = ["ei", "at"];
  const compDims: DimensionKey[] = ["sn", "tf", "jp"];
  let score = 0;
  similarDims.forEach((dim) => {
    score += (100 - Math.abs(s1[dim] - s2[dim])) / 2;
  });
  compDims.forEach((dim) => {
    const diff = Math.abs(s1[dim] - s2[dim]);
    if (diff >= 25 && diff <= 55) score += 40;
    else if (diff >= 15 && diff <= 65) score += 25;
    else score += 10;
  });
  return Math.round((score / 220) * 100);
}

function calculateArchetypeAlignment(a1?: string, a2?: string): number {
  if (!a1 || !a2) return 50;
  if (a1 === a2) return 95;
  const categoryMap: Record<string, string> = {
    INFJ: "DIPLOMAT", INFP: "DIPLOMAT", ENFJ: "DIPLOMAT", ENFP: "DIPLOMAT",
    INTJ: "STRATEGER", INTP: "STRATEGER", ENTJ: "STRATEGER", ENTP: "STRATEGER",
    ISTJ: "BYGGARE", ISFJ: "BYGGARE", ESTJ: "BYGGARE", ESFJ: "BYGGARE",
    ISTP: "UPPTÄCKARE", ISFP: "UPPTÄCKARE", ESTP: "UPPTÄCKARE", ESFP: "UPPTÄCKARE",
  };
  const c1 = categoryMap[a1];
  const c2 = categoryMap[a2];
  if (c1 && c2 && c1 === c2) return 80;
  return 60;
}

function calculateInterestOverlap(i1?: string[], i2?: string[]): number {
  if (!i1?.length || !i2?.length) return 50;
  const set1 = new Set(i1.map((x) => x.toLowerCase()));
  const set2 = new Set(i2.map((x) => x.toLowerCase()));
  let overlap = 0;
  set1.forEach((x) => {
    if (set2.has(x)) overlap++;
  });
  const maxPossible = Math.min(set1.size, set2.size);
  return maxPossible === 0 ? 50 : Math.round((overlap / maxPossible) * 100);
}

function calculateCompositeScore(
  user: UserProfile,
  candidate: MatchCandidate
): { total: number; breakdown: Record<string, number> } {
  const personality = calculateSimilarityScore(user.scores, candidate.scores);
  const archetype = calculateArchetypeAlignment(user.archetype, candidate.archetype);
  const interests = calculateInterestOverlap(user.interests, candidate.interests);
  const total =
    personality * SCORE_SIGNALS.PERSONALITY_SIMILARITY +
    archetype * SCORE_SIGNALS.ARCHETYPE_ALIGNMENT +
    interests * SCORE_SIGNALS.INTEREST_OVERLAP;
  return { total: Math.round(total), breakdown: { personality, archetype, interests } };
}

function getDimensionBreakdown(user: UserProfile, candidate: MatchCandidate): DimensionBreakdown[] {
  const { breakdown } = calculateCompositeScore(user, candidate);
  const desc: Record<string, { high: string; medium: string; low: string }> = {
    personality: { high: "Ni delar liknande personlighetsdrag", medium: "Era personligheter kompletterar varandra", low: "Era personligheter är olika men kan balansera" },
    archetype: { high: "Era arketyper harmonierar väl", medium: "Era arketyper skapar intressant dynamik", low: "Era arketyper utmanar varandra positivt" },
    interests: { high: "Många gemensamma intressen", medium: "Några gemensamma intressen", low: "Möjlighet att upptäcka nya intressen" },
  };
  return Object.entries(breakdown).map(([dimension, score]) => {
    const alignment = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
    const d = desc[dimension];
    return {
      dimension,
      score,
      alignment,
      description: d ? d[alignment] : "",
    };
  });
}

function calculateAnxietyReduction(s1: PersonalityScores, s2: PersonalityScores): number {
  const avgEnergy = (s1.ei + s2.ei) / 2;
  const tfDiff = Math.abs(s1.tf - s2.tf);
  return Math.min(100, Math.round(avgEnergy + (100 - tfDiff) / 4));
}

function generateUserMatchPool(
  currentUser: UserProfile,
  candidates: MatchCandidate[],
  batchSize: number,
  previousMatchedIds: string[] = []
): MatchResult[] {
  const otherUsers = candidates.filter((c) => c.userId !== currentUser.userId);
  const eligible = otherUsers.filter((c) => passesDealbreakers(currentUser, c));
  const prevSet = new Set(previousMatchedIds);
  const fresh = eligible.filter((c) => !prevSet.has(c.userId));
  const pool = fresh.length >= batchSize ? fresh : fresh.length > 0 ? fresh : eligible;
  if (pool.length === 0) return [];

  const scored = pool.map((candidate) => {
    const { total, breakdown } = calculateCompositeScore(currentUser, candidate);
    return {
      candidate,
      compositeScore: total,
      similarScore: calculateSimilarityScore(currentUser.scores, candidate.scores),
      complementaryScore: calculateComplementaryScore(currentUser.scores, candidate.scores),
      breakdown,
      interestScore: calculateInterestOverlap(currentUser.interests, candidate.interests),
      archetypeScore: calculateArchetypeAlignment(currentUser.archetype, candidate.archetype),
    };
  });

  const actualBatchSize = Math.min(batchSize, pool.length);
  const similarCount = Math.ceil(actualBatchSize * MATCH_RATIO.SIMILAR);
  const complementaryCount = actualBatchSize - similarCount;

  const similarMatches = [...scored]
    .sort((a, b) => {
      if (b.similarScore !== a.similarScore) return b.similarScore - a.similarScore;
      if (b.interestScore !== a.interestScore) return b.interestScore - a.interestScore;
      return b.archetypeScore - a.archetypeScore;
    })
    .slice(0, similarCount)
    .map((item) => ({
      user: item.candidate,
      matchType: "similar" as const,
      matchScore: item.similarScore,
      compositeScore: item.compositeScore,
      dimensionBreakdown: getDimensionBreakdown(currentUser, item.candidate),
      archetypeScore: item.archetypeScore,
      anxietyScore: calculateAnxietyReduction(currentUser.scores, item.candidate.scores),
    }));

  const similarIds = new Set(similarMatches.map((m) => m.user.userId));
  const complementaryMatches = [...scored]
    .filter((item) => !similarIds.has(item.candidate.userId))
    .sort((a, b) => {
      if (b.complementaryScore !== a.complementaryScore) return b.complementaryScore - a.complementaryScore;
      if (b.interestScore !== a.interestScore) return b.interestScore - a.interestScore;
      return b.archetypeScore - a.archetypeScore;
    })
    .slice(0, complementaryCount)
    .map((item) => ({
      user: item.candidate,
      matchType: "complementary" as const,
      matchScore: item.complementaryScore,
      compositeScore: item.compositeScore,
      dimensionBreakdown: getDimensionBreakdown(currentUser, item.candidate),
      archetypeScore: item.archetypeScore,
      anxietyScore: calculateAnxietyReduction(currentUser.scores, item.candidate.scores),
    }));

  const all = [...similarMatches, ...complementaryMatches];
  return all.sort(() => Math.random() - 0.5);
}

// --- Pool output format expected by match-daily ---
interface CandidateUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  age?: number;
  archetype?: string;
  photos?: string[];
  bio?: string;
}

interface MatchPoolCandidate {
  user: CandidateUser;
  matchType: "similar" | "complementary";
  matchScore: number;
  dimensionBreakdown?: DimensionBreakdown[];
  archetypeScore?: number;
  anxietyScore?: number;
  icebreakers?: string[];
  personalityInsight?: string;
  commonInterests?: string[];
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });
    const yesterday = new Date(Date.now() - 864e5).toLocaleDateString("en-CA", { timeZone: "Europe/Stockholm" });
    const BATCH_SIZE = 10;

    // 1. Fetch profiles with personality_results (eligible for matching)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "id, user_id, display_name, avatar_url, date_of_birth, gender, min_age, max_age, interested_in, looking_for, onboarding_completed, bio"
      )
      .eq("onboarding_completed", true);

    if (profilesError) {
      console.error("Profiles error:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profiles", message: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: personalityRows, error: persError } = await supabase
      .from("personality_results")
      .select("user_id, scores, archetype, category");

    if (persError) {
      console.error("Personality error:", persError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch personality results", message: persError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const personalityByUserId = new Map(
      (personalityRows || []).map((r: { user_id: string; scores: unknown; archetype: string | null; category: string }) => [
        r.user_id,
        {
          scores: (r.scores || {}) as PersonalityScores,
          archetype: r.archetype || "INFJ",
          category: r.category as PersonalityCategory,
        },
      ])
    );

    // Map profile id to auth user id for pool row (user_daily_match_pools.user_id = profile id when profiles.id = auth.uid())
    const profileIdToAuthId = new Map<string, string>();
    const candidatesList: MatchCandidate[] = [];
    const profileIdToCandidate = new Map<string, MatchCandidate>();

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
      const candidate: MatchCandidate = {
        userId: pid,
        displayName: (p.display_name as string) || "Anonym",
        avatarUrl: (p.avatar_url as string) || undefined,
        category: pers.category,
        archetype: pers.archetype,
        scores,
        bio: (p.bio as string) || undefined,
        age,
        gender: (p.gender as string) || undefined,
        interests: [],
        onboardingCompleted: p.onboarding_completed === true,
      };
      candidatesList.push(candidate);
      profileIdToCandidate.set(pid, candidate);
    }

    if (candidatesList.length < 2) {
      return new Response(
        JSON.stringify({ date: today, users_processed: 0, message: "Not enough users with personality results" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 2. Yesterday's delivered match ids per user (for repeat avoidance)
    const { data: yesterdayMatches } = await supabase
      .from("matches")
      .select("user_id, matched_user_id")
      .eq("match_date", yesterday);

    const previousByUser = new Map<string, string[]>();
    for (const row of yesterdayMatches || []) {
      const uid = (row as { user_id: string }).user_id;
      const mid = (row as { matched_user_id: string }).matched_user_id;
      if (!previousByUser.has(uid)) previousByUser.set(uid, []);
      previousByUser.get(uid)!.push(mid);
    }

    // 3. Profile photos for candidates (for pool display)
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

    // 4. Build UserProfile for each recipient and generate pool
    const poolInserts: { user_id: string; pool_date: string; candidates_data: MatchPoolCandidate[] }[] = [];
    type ProfileRow = { id: string; min_age?: number; max_age?: number; interested_in?: string; looking_for?: string };
    const getProfile = (userId: string) => (profiles || []).find((p: { id: string }) => p.id === userId) as ProfileRow | undefined;

    for (const c of candidatesList) {
      const profileRow = getProfile(c.userId);
      const currentUser: UserProfile = {
        ...c,
        minAge: profileRow?.min_age ?? undefined,
        maxAge: profileRow?.max_age ?? undefined,
        interestedIn: profileRow?.interested_in ?? profileRow?.looking_for ?? undefined,
      };

      const recipientAuthId = profileIdToAuthId.get(currentUser.userId) ?? currentUser.userId;
      const previousMatchedIds = previousByUser.get(recipientAuthId) || [];
      const results = generateUserMatchPool(currentUser, candidatesList, BATCH_SIZE, previousMatchedIds);
      if (results.length === 0) continue;

      const poolCandidates: MatchPoolCandidate[] = results.map((m) => ({
        user: {
          userId: m.user.userId,
          displayName: m.user.displayName,
          avatarUrl: m.user.avatarUrl,
          age: m.user.age,
          archetype: m.user.archetype,
          photos: photosByUserId.get(m.user.userId) || [],
          bio: m.user.bio,
        },
        matchType: m.matchType,
        matchScore: m.matchScore,
        dimensionBreakdown: m.dimensionBreakdown,
        archetypeScore: m.archetypeScore ?? 80,
        anxietyScore: m.anxietyScore ?? 75,
        icebreakers: ["Hej!", "Hur mår du?", "Vad gör du?"],
        personalityInsight: "Ni delar liknande värderingar",
        commonInterests: [],
      }));

      // user_daily_match_pools.user_id must equal auth.uid() for match-daily to find the pool
      poolInserts.push({
        user_id: recipientAuthId,
        pool_date: today,
        candidates_data: poolCandidates,
      });
    }

    // 5. Upsert pools (one row per user per day)
    let inserted = 0;
    for (const row of poolInserts) {
      const { error: insertErr } = await supabase
        .from("user_daily_match_pools")
        .upsert(
          {
            user_id: row.user_id,
            pool_date: row.pool_date,
            candidates_data: row.candidates_data,
          },
          { onConflict: "user_id,pool_date" }
        );
      if (insertErr) {
        console.error("Pool insert error for", row.user_id, insertErr);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        date: today,
        users_processed: inserted,
        total_eligible: candidatesList.length,
        batch_size: BATCH_SIZE,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    console.error("generate-match-pools error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
