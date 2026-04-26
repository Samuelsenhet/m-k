/**
 * 16×16 archetype-pair compatibility matrix.
 *
 * Hand-tuned from MBTI compatibility tradition (Keirsey, Myers-Briggs)
 * and complementary-pair theory (NJ↔NP, SJ↔SP). Score scale:
 *   90–100  golden pair      — natural complement
 *   75–89   high              — strong fit
 *   60–74   moderate          — works with effort
 *   45–59   friction          — needs self-awareness
 *    0–44   clash             — rarely works
 *
 * Stored as a lower-triangle keyed by alphabetically-sorted pair string,
 * then expanded into a symmetric 16×16 record at module load.
 */

import type { ArchetypeCode } from "./personality.js";
import type { MatchPairLabel } from "./match-types.js";

const ALL_ARCHETYPES: ArchetypeCode[] = [
  "INFJ", "INFP", "ENFJ", "ENFP",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

/** Build "ARCHETYPE_A-ARCHETYPE_B" with the two codes alphabetically sorted. */
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

/** Symmetric 16×16 record built from the lower triangle above. */
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
          `archetype-compatibility: missing pair score for ${a}-${b}`,
        );
      }
      result[a][b] = score;
    }
  }
  return result;
})();

/** Look up the compatibility score for an ordered pair. Symmetric: a×b === b×a. */
export function getPairScore(a: ArchetypeCode, b: ArchetypeCode): number {
  return ARCHETYPE_PAIR_SCORES[a][b];
}

/** Bucket a 0–100 score into a human-readable label. */
export function getPairLabel(score: number): MatchPairLabel {
  if (score >= 90) return "golden complementary";
  if (score >= 75) return "high compatibility";
  if (score >= 60) return "moderate";
  if (score >= 45) return "friction";
  return "clash";
}

/** True if the pair is in the "golden" bucket — drives the complementary_bonus. */
export function isGoldenPair(score: number): boolean {
  return score >= 88;
}
