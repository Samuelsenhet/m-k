/**
 * Monster Match v1 — match classification + multi-factor composite scoring.
 *
 * Imported by the iOS client (via @maak/core) and mirrored byte-for-byte in
 * `supabase/functions/_shared/match_math.ts` for use inside Deno edge
 * functions. If you change anything here, change it there too.
 */

import type { DimensionKey } from "./personality.js";
import type {
  DimensionAlignment,
  DimensionImpact,
  DrivingDimension,
  MatchSubtype,
  SignalBreakdown,
} from "./match-types.js";
import {
  DIMENSION_FRICTION_THRESHOLD,
  SUBTYPE_TARGET_RATIOS,
} from "./match-types.js";
import { isGoldenPair } from "./archetype-compatibility.js";

const DIMENSIONS: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];

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
    if ((dim === "tf" || dim === "at") && d > 10 && impact === "low") {
      impact = "medium";
    }
    return { dim, their: t, your: y, alignment, impact };
  });

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

  if (DIMENSIONS.every(matching)) return "similar";

  const frictionDims = DIMENSIONS.filter(friction);
  if (
    frictionDims.length >= 1 &&
    frictionDims.length <= 2 &&
    (frictionDims.includes("tf") || frictionDims.includes("at"))
  ) {
    return "growth";
  }

  const compFriction = (["ei", "sn", "jp"] as DimensionKey[]).filter(friction);
  if (compFriction.length >= 2 && matching("tf") && matching("at")) {
    return "complementary";
  }

  return "similar";
}

/**
 * Set-intersection-based interest overlap. Returns 0–100. Returns 50
 * ("neutral") when either side has no listed interests.
 */
export function interestOverlap(
  a: string[] | undefined,
  b: string[] | undefined,
): number {
  if (!a?.length || !b?.length) return 50;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let intersect = 0;
  for (const s of setA) if (setB.has(s)) intersect++;
  const denom = Math.min(setA.size, setB.size);
  return denom === 0 ? 50 : Math.round((intersect / denom) * 100);
}

/**
 * Soft geo/demographic proximity score (0–100). v1 uses age proximity since
 * we don't have lat/lng yet. Returns 50 (neutral) if either age is missing.
 */
export function geoScore(
  ageA: number | undefined,
  ageB: number | undefined,
): number {
  if (ageA === undefined || ageB === undefined) return 50;
  const diff = Math.abs(ageA - ageB);
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
}): { total: number; breakdown: SignalBreakdown } {
  const complementary_bonus =
    parts.subtype === "complementary" && isGoldenPair(parts.archetype) ? 100 : 0;
  const total =
    0.45 * parts.personality +
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
    },
  };
}

/**
 * Fill a batch of `batchSize` matches towards `SUBTYPE_TARGET_RATIOS`
 * (50% similar, 35% complementary, 15% growth). If a subtype is short on
 * candidates the remainder is filled from highest-score leftovers.
 */
export function balanceBatch<T>(
  scored: Array<{ candidate: T; subtype: MatchSubtype; score: number }>,
  batchSize: number,
): Array<{ candidate: T; subtype: MatchSubtype; score: number }> {
  if (scored.length === 0) return [];
  const actual = Math.min(batchSize, scored.length);

  const buckets: Record<MatchSubtype, typeof scored> = {
    similar: [],
    complementary: [],
    growth: [],
  };
  for (const s of scored) buckets[s.subtype].push(s);
  for (const k of Object.keys(buckets) as MatchSubtype[]) {
    buckets[k].sort((a, b) => b.score - a.score);
  }

  const targets: Record<MatchSubtype, number> = {
    similar: Math.floor(actual * SUBTYPE_TARGET_RATIOS.similar),
    complementary: Math.floor(actual * SUBTYPE_TARGET_RATIOS.complementary),
    growth: Math.floor(actual * SUBTYPE_TARGET_RATIOS.growth),
  };
  const allocated = targets.similar + targets.complementary + targets.growth;
  targets.similar += actual - allocated;

  const picked: typeof scored = [];
  const leftover: typeof scored = [];
  for (const k of ["similar", "complementary", "growth"] as MatchSubtype[]) {
    const want = targets[k];
    const got = buckets[k].slice(0, want);
    picked.push(...got);
    leftover.push(...buckets[k].slice(want));
  }

  leftover.sort((a, b) => b.score - a.score);
  while (picked.length < actual && leftover.length > 0) {
    picked.push(leftover.shift()!);
  }

  picked.sort((a, b) => b.score - a.score);
  return picked;
}
