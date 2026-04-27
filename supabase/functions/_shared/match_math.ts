/**
 * Monster Match v1 — math primitives for Deno edge functions.
 *
 * Mirrors `packages/core/src/personality.ts` (weightedDistance + DIMENSION_WEIGHTS)
 * and `packages/core/src/archetype-compatibility.ts` (ARCHETYPE_PAIR_SCORES + helpers)
 * because Deno cannot import npm workspaces. Keep in sync with the @maak/core
 * sources — same pattern as `_shared/llm.ts` mirrors `match-types.ts`.
 *
 * Adds Monster Match v1-specific helpers that don't live in @maak/core yet:
 * `classifyMatchSubtype`, `buildDrivingDimensions`, `computeCompositeScore`,
 * `balanceBatch`, `interestOverlap`, `geoScore`.
 */

// ---------- types (mirror @maak/core/match-types.ts) ----------

export type DimensionKey = "ei" | "sn" | "tf" | "jp" | "at";

export type ArchetypeCode =
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type MatchSubtype = "similar" | "complementary" | "growth";

export type MatchPairLabel =
  | "golden complementary"
  | "high compatibility"
  | "moderate"
  | "mirror"
  | "friction"
  | "clash";

export type DimensionAlignment = "similar" | "complementary";
export type DimensionImpact = "high" | "medium" | "low";

export type DrivingDimension = {
  dim: DimensionKey;
  their: number;
  your: number;
  alignment: DimensionAlignment;
  impact: DimensionImpact;
};

export type ArchetypePair = {
  their: ArchetypeCode;
  yours: ArchetypeCode;
  pair_score: number;
  label: MatchPairLabel;
};

export type SignalBreakdown = {
  personality: number;
  archetype_pair: number;
  interests: number;
  geo: number;
  complementary_bonus: number;
  // Synthesis layer (Monster Match v1 refit). Both null when MONSTER_MATCH_ENABLED
  // is off OR when user_signals/LLM are unavailable.
  embedding_similarity?: number | null;
  llm_judgment?: number | null;
};

// ---------- constants (mirror @maak/core) ----------

export const DIMENSIONS: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];

export const DIMENSION_WEIGHTS: Record<
  "similar" | "complementary",
  Record<DimensionKey, number>
> = {
  similar: { ei: 0.8, sn: 0.9, tf: 1.4, jp: 1.0, at: 1.3 },
  complementary: { ei: 1.2, sn: 1.1, tf: 1.4, jp: 1.0, at: 1.3 },
};

/** Per-dimension distance under which a dim is "matching" rather than "friction". */
export const DIMENSION_FRICTION_THRESHOLD = 30;

/** |LLM - math| score divergence above this is logged for review. */
export const VALIDATION_DIVERGENCE_THRESHOLD = 25;

/** Target distribution of subtypes per daily batch. */
export const SUBTYPE_TARGET_RATIOS: Record<MatchSubtype, number> = {
  similar: 0.5,
  complementary: 0.35,
  growth: 0.15,
};

/** Archetype-pair score above which a complementary subtype counts as "golden". */
export const GOLDEN_PAIR_THRESHOLD = 88;

// ---------- 16x16 archetype-pair compatibility matrix ----------

const ALL_ARCHETYPES: ArchetypeCode[] = [
  "INFJ", "INFP", "ENFJ", "ENFP",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

function pairKey(a: ArchetypeCode, b: ArchetypeCode): string {
  return [a, b].sort().join("-");
}

const RAW_PAIR_SCORES: Record<string, number> = {
  // DIPLOMAT × DIPLOMAT (NF)
  "ENFJ-ENFJ": 75, "ENFJ-ENFP": 84, "ENFJ-INFJ": 80, "ENFJ-INFP": 88,
  "ENFP-ENFP": 76, "ENFP-INFJ": 92, "ENFP-INFP": 80,
  "INFJ-INFJ": 78, "INFJ-INFP": 82,
  "INFP-INFP": 76,

  // DIPLOMAT × STRATEGER (NF × NT) — many golden pairs here
  "ENFJ-ENTJ": 76, "ENFJ-ENTP": 80, "ENFJ-INTJ": 82, "ENFJ-INTP": 88,
  "ENFP-ENTJ": 82, "ENFP-ENTP": 78, "ENFP-INTJ": 90, "ENFP-INTP": 82,
  "ENTJ-INFJ": 78, "ENTJ-INFP": 86,
  "ENTP-INFJ": 90, "ENTP-INFP": 82,
  "INFJ-INTJ": 84, "INFJ-INTP": 80,
  "INFP-INTJ": 80, "INFP-INTP": 78,

  // STRATEGER × STRATEGER (NT)
  "ENTJ-ENTJ": 70, "ENTJ-ENTP": 78, "ENTJ-INTJ": 78, "ENTJ-INTP": 80,
  "ENTP-ENTP": 74, "ENTP-INTJ": 84, "ENTP-INTP": 80,
  "INTJ-INTJ": 80, "INTJ-INTP": 78,
  "INTP-INTP": 76,

  // DIPLOMAT × BYGGARE (NF × SJ) — friction territory
  "ENFJ-ESFJ": 70, "ENFJ-ESTJ": 62, "ENFJ-ISFJ": 70, "ENFJ-ISTJ": 58,
  "ENFP-ESFJ": 64, "ENFP-ESTJ": 56, "ENFP-ISFJ": 62, "ENFP-ISTJ": 58,
  "ESFJ-INFJ": 62, "ESFJ-INFP": 60,
  "ESTJ-INFJ": 50, "ESTJ-INFP": 48,
  "INFJ-ISFJ": 64, "INFJ-ISTJ": 56,
  "INFP-ISFJ": 66, "INFP-ISTJ": 52,

  // STRATEGER × BYGGARE (NT × SJ)
  "ENTJ-ESFJ": 68, "ENTJ-ESTJ": 76, "ENTJ-ISFJ": 64, "ENTJ-ISTJ": 72,
  "ENTP-ESFJ": 60, "ENTP-ESTJ": 62, "ENTP-ISFJ": 58, "ENTP-ISTJ": 60,
  "ESFJ-INTJ": 60, "ESFJ-INTP": 56,
  "ESTJ-INTJ": 72, "ESTJ-INTP": 62,
  "INTJ-ISFJ": 64, "INTJ-ISTJ": 70,
  "INTP-ISFJ": 60, "INTP-ISTJ": 64,

  // DIPLOMAT × UPPTÄCKARE (NF × SP) — growth territory
  "ENFJ-ESFP": 72, "ENFJ-ESTP": 64, "ENFJ-ISFP": 70, "ENFJ-ISTP": 58,
  "ENFP-ESFP": 72, "ENFP-ESTP": 70, "ENFP-ISFP": 76, "ENFP-ISTP": 66,
  "ESFP-INFJ": 64, "ESFP-INFP": 70,
  "ESTP-INFJ": 54, "ESTP-INFP": 58,
  "INFJ-ISFP": 70, "INFJ-ISTP": 60,
  "INFP-ISFP": 76, "INFP-ISTP": 64,

  // STRATEGER × UPPTÄCKARE (NT × SP)
  "ENTJ-ESFP": 60, "ENTJ-ESTP": 70, "ENTJ-ISFP": 56, "ENTJ-ISTP": 66,
  "ENTP-ESFP": 68, "ENTP-ESTP": 72, "ENTP-ISFP": 64, "ENTP-ISTP": 70,
  "ESFP-INTJ": 56, "ESFP-INTP": 60,
  "ESTP-INTJ": 64, "ESTP-INTP": 66,
  "INTJ-ISFP": 60, "INTJ-ISTP": 70,
  "INTP-ISFP": 64, "INTP-ISTP": 74,

  // BYGGARE × BYGGARE (SJ)
  "ESFJ-ESFJ": 76, "ESFJ-ESTJ": 76, "ESFJ-ISFJ": 80, "ESFJ-ISTJ": 78,
  "ESTJ-ESTJ": 72, "ESTJ-ISFJ": 76, "ESTJ-ISTJ": 78,
  "ISFJ-ISFJ": 76, "ISFJ-ISTJ": 80,
  "ISTJ-ISTJ": 76,

  // BYGGARE × UPPTÄCKARE (SJ × SP) — classic golden territory
  "ESFJ-ESFP": 76, "ESFJ-ESTP": 72, "ESFJ-ISFP": 76, "ESFJ-ISTP": 70,
  "ESFP-ESTJ": 68, "ESFP-ISFJ": 80, "ESFP-ISTJ": 76,
  "ESTJ-ESTP": 70, "ESTJ-ISFP": 72, "ESTJ-ISTP": 72,
  "ESTP-ISFJ": 74, "ESTP-ISTJ": 78,
  "ISFJ-ISFP": 70, "ISFJ-ISTP": 66,
  "ISFP-ISTJ": 64, "ISTJ-ISTP": 68,

  // UPPTÄCKARE × UPPTÄCKARE (SP)
  "ESFP-ESFP": 72, "ESFP-ESTP": 76, "ESFP-ISFP": 78, "ESFP-ISTP": 70,
  "ESTP-ESTP": 70, "ESTP-ISFP": 70, "ESTP-ISTP": 78,
  "ISFP-ISFP": 72, "ISFP-ISTP": 74,
  "ISTP-ISTP": 70,
};

export const ARCHETYPE_PAIR_SCORES: Record<
  ArchetypeCode,
  Record<ArchetypeCode, number>
> = (() => {
  const result = {} as Record<ArchetypeCode, Record<ArchetypeCode, number>>;
  for (const a of ALL_ARCHETYPES) {
    result[a] = {} as Record<ArchetypeCode, number>;
    for (const b of ALL_ARCHETYPES) {
      const score = RAW_PAIR_SCORES[pairKey(a, b)];
      if (score === undefined) {
        throw new Error(
          `match_math: missing pair score for ${a}-${b}`,
        );
      }
      result[a][b] = score;
    }
  }
  return result;
})();

export function getPairScore(a: ArchetypeCode, b: ArchetypeCode): number {
  return ARCHETYPE_PAIR_SCORES[a][b];
}

export function getPairLabel(score: number): MatchPairLabel {
  if (score >= 90) return "golden complementary";
  if (score >= 75) return "high compatibility";
  if (score >= 60) return "moderate";
  if (score >= 45) return "friction";
  return "clash";
}

export function isGoldenPair(score: number): boolean {
  return score >= GOLDEN_PAIR_THRESHOLD;
}

// ---------- Monster Match v1 helpers ----------

/**
 * Weighted Euclidean distance between two personality profiles, normalised to
 * a 0–100 similarity score (100 = identical, 0 = maximum distance).
 *
 * Mirrors `weightedDistance` in @maak/core/personality.ts.
 */
export function weightedDistance(
  a: Record<DimensionKey, number>,
  b: Record<DimensionKey, number>,
  mode: "similar" | "complementary" = "similar",
): number {
  const weights = DIMENSION_WEIGHTS[mode];

  let sumSq = 0;
  let sumW = 0;
  for (const d of DIMENSIONS) {
    const diff = (a[d] ?? 50) - (b[d] ?? 50);
    sumSq += weights[d] * diff * diff;
    sumW += weights[d];
  }

  const maxDist = Math.sqrt(sumW * 10000);
  const dist = Math.sqrt(sumSq);
  const similarity = 100 * (1 - dist / maxDist);
  return Math.max(0, Math.min(100, Math.round(similarity)));
}

/**
 * Per-dimension analysis for a (you, them) pair. Sorted by impact descending —
 * the LLM gets the most relevant dimensions first.
 */
export function buildDrivingDimensions(
  yours: Record<DimensionKey, number>,
  theirs: Record<DimensionKey, number>,
): DrivingDimension[] {
  const result: DrivingDimension[] = DIMENSIONS.map((dim) => {
    const y = yours[dim] ?? 50;
    const t = theirs[dim] ?? 50;
    const d = Math.abs(y - t);
    const alignment: DimensionAlignment =
      d <= DIMENSION_FRICTION_THRESHOLD ? "similar" : "complementary";
    let impact: DimensionImpact;
    if (d >= 50) impact = "high";
    else if (d >= 20) impact = "medium";
    else impact = "low";
    // For tf and at, even small distances matter — bump impact one level.
    if ((dim === "tf" || dim === "at") && d > 10 && impact === "low") {
      impact = "medium";
    }
    return { dim, their: t, your: y, alignment, impact };
  });

  // Sort: high impact first, then medium, then low. tf/at as tie-breakers.
  const impactRank: Record<DimensionImpact, number> = { high: 3, medium: 2, low: 1 };
  const dimRank: Record<DimensionKey, number> = { tf: 5, at: 4, ei: 3, sn: 2, jp: 1 };
  return result.sort((a, b) => {
    const r = impactRank[b.impact] - impactRank[a.impact];
    if (r !== 0) return r;
    return dimRank[b.dim] - dimRank[a.dim];
  });
}

/**
 * Classify the match into one of three subtypes based on per-dimension
 * distances. See spec section 2D in `~/.claude/plans/context-pure-taco.md`.
 */
export function classifyMatchSubtype(
  yours: Record<DimensionKey, number>,
  theirs: Record<DimensionKey, number>,
): MatchSubtype {
  const distances: Record<DimensionKey, number> = {
    ei: Math.abs((yours.ei ?? 50) - (theirs.ei ?? 50)),
    sn: Math.abs((yours.sn ?? 50) - (theirs.sn ?? 50)),
    tf: Math.abs((yours.tf ?? 50) - (theirs.tf ?? 50)),
    jp: Math.abs((yours.jp ?? 50) - (theirs.jp ?? 50)),
    at: Math.abs((yours.at ?? 50) - (theirs.at ?? 50)),
  };

  const friction = (d: DimensionKey) => distances[d] > DIMENSION_FRICTION_THRESHOLD;
  const matching = (d: DimensionKey) => !friction(d);

  // similar: all 5 dims under threshold
  if (DIMENSIONS.every(matching)) return "similar";

  // growth: 1–2 friction dims including at least one of {tf, at}; rest matches
  const frictionDims = DIMENSIONS.filter(friction);
  if (
    frictionDims.length >= 1 &&
    frictionDims.length <= 2 &&
    (frictionDims.includes("tf") || frictionDims.includes("at"))
  ) {
    return "growth";
  }

  // complementary: 2+ friction dims among {ei, sn, jp}; tf+at match
  const compFriction = (["ei", "sn", "jp"] as DimensionKey[]).filter(friction);
  if (
    compFriction.length >= 2 &&
    matching("tf") &&
    matching("at")
  ) {
    return "complementary";
  }

  // Fallback: similar (we don't return clash — algorithm always returns one of the three)
  return "similar";
}

/**
 * Set-intersection-based interest overlap. Returns 0–100.
 * Returns 50 ("neutral") when either side has no listed interests so we don't
 * unfairly punish onboarding-light profiles.
 */
export function interestOverlap(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 50;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let intersect = 0;
  for (const s of setA) if (setB.has(s)) intersect++;
  const denom = Math.min(setA.size, setB.size);
  return denom === 0 ? 50 : Math.round((intersect / denom) * 100);
}

/**
 * Soft geo/demographic proximity score (0–100). Lager 1+2 use age proximity
 * since we don't have lat/lng on profiles yet — this can grow when geocoding
 * lands.
 */
export function geoScore(
  ageA: number | undefined,
  ageB: number | undefined,
): number {
  if (ageA === undefined || ageB === undefined) return 50;
  const diff = Math.abs(ageA - ageB);
  // 0 yr = 100, 5 yr = 75, 10 yr = 50, 15 yr = 25, 20+ yr = 0.
  return Math.max(0, Math.min(100, Math.round(100 - diff * 5)));
}

/**
 * Multi-factor composite score. See spec section 2C.
 *   45% personality + 25% archetype + 15% interests + 10% geo + 5% complementary_bonus
 */
export function computeCompositeScore(parts: {
  personality: number;
  archetype: number;
  interests: number;
  geo: number;
  subtype: MatchSubtype;
  embedding_similarity?: number | null;
  llm_judgment?: number | null;
}): { total: number; breakdown: SignalBreakdown } {
  const complementary_bonus =
    parts.subtype === "complementary" && isGoldenPair(parts.archetype) ? 100 : 0;

  const hasSynthesis =
    typeof parts.embedding_similarity === "number" &&
    typeof parts.llm_judgment === "number";

  const total = hasSynthesis
    ? 0.30 * parts.personality +
      0.20 * parts.archetype +
      0.20 * (parts.embedding_similarity as number) +
      0.20 * (parts.llm_judgment as number) +
      0.05 * parts.interests +
      0.05 * parts.geo
    : 0.45 * parts.personality +
      0.25 * parts.archetype +
      0.15 * parts.interests +
      0.10 * parts.geo +
      0.05 * complementary_bonus;

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    breakdown: {
      personality: parts.personality,
      archetype_pair: parts.archetype,
      interests: parts.interests,
      geo: parts.geo,
      complementary_bonus,
      embedding_similarity: parts.embedding_similarity ?? null,
      llm_judgment: parts.llm_judgment ?? null,
    },
  };
}

/**
 * Cosine similarity for two equal-length numeric vectors → 0–100 score.
 * Returns 50 (neutral) for invalid inputs (mismatched lengths or zero vectors).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 50;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 50;
  const cos = dot / denom;
  const mapped = Math.round(((cos + 1) / 2) * 100);
  return Math.max(0, Math.min(100, mapped));
}

/**
 * Fill a batch of `batchSize` matches towards `SUBTYPE_TARGET_RATIOS`
 * (50% similar, 35% complementary, 15% growth). If a subtype is short on
 * candidates, the remainder is filled from highest-score leftovers.
 *
 * Generic over any payload `T` so it can be reused for both pool generation
 * and ad-hoc selection.
 */
export function balanceBatch<T>(
  scored: Array<{ candidate: T; subtype: MatchSubtype; score: number }>,
  batchSize: number,
): Array<{ candidate: T; subtype: MatchSubtype; score: number }> {
  if (scored.length === 0) return [];
  const actual = Math.min(batchSize, scored.length);

  // Bucketize and sort each bucket descending by score.
  const buckets: Record<MatchSubtype, typeof scored> = {
    similar: [],
    complementary: [],
    growth: [],
  };
  for (const s of scored) buckets[s.subtype].push(s);
  for (const k of Object.keys(buckets) as MatchSubtype[]) {
    buckets[k].sort((a, b) => b.score - a.score);
  }

  // Compute targets — round down individually, give remainder to similar.
  const targets: Record<MatchSubtype, number> = {
    similar: Math.floor(actual * SUBTYPE_TARGET_RATIOS.similar),
    complementary: Math.floor(actual * SUBTYPE_TARGET_RATIOS.complementary),
    growth: Math.floor(actual * SUBTYPE_TARGET_RATIOS.growth),
  };
  const allocated = targets.similar + targets.complementary + targets.growth;
  targets.similar += actual - allocated;

  // Pull from each bucket up to its target; leftover slots filled later.
  const picked: typeof scored = [];
  const leftover: typeof scored = [];
  for (const k of ["similar", "complementary", "growth"] as MatchSubtype[]) {
    const want = targets[k];
    const got = buckets[k].slice(0, want);
    picked.push(...got);
    leftover.push(...buckets[k].slice(want));
  }

  // Fill remaining slots with highest-score leftovers across subtypes.
  leftover.sort((a, b) => b.score - a.score);
  while (picked.length < actual && leftover.length > 0) {
    picked.push(leftover.shift()!);
  }

  // Final sort by score descending — caller can shuffle if randomization desired.
  picked.sort((a, b) => b.score - a.score);
  return picked;
}
