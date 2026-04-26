import { describe, it, expect } from "vitest";
import {
  ARCHETYPE_PAIR_SCORES,
  getPairScore,
  getPairLabel,
  isGoldenPair,
} from "../archetype-compatibility";
import type { ArchetypeCode } from "../personality";

const ALL_ARCHETYPES: ArchetypeCode[] = [
  "INFJ", "INFP", "ENFJ", "ENFP",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

describe("ARCHETYPE_PAIR_SCORES", () => {
  it("contains all 16×16 entries", () => {
    for (const a of ALL_ARCHETYPES) {
      for (const b of ALL_ARCHETYPES) {
        expect(ARCHETYPE_PAIR_SCORES[a]?.[b]).toBeDefined();
      }
    }
  });

  it("is symmetric — pair[a][b] === pair[b][a]", () => {
    for (const a of ALL_ARCHETYPES) {
      for (const b of ALL_ARCHETYPES) {
        expect(ARCHETYPE_PAIR_SCORES[a][b]).toBe(ARCHETYPE_PAIR_SCORES[b][a]);
      }
    }
  });

  it("scores all in 0–100 range", () => {
    for (const a of ALL_ARCHETYPES) {
      for (const b of ALL_ARCHETYPES) {
        const score = ARCHETYPE_PAIR_SCORES[a][b];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("includes the canonical golden pairs", () => {
    // Classical "golden" complementary pairs from MBTI lore.
    expect(getPairScore("INFJ", "ENFP")).toBeGreaterThanOrEqual(90);
    expect(getPairScore("INTJ", "ENFP")).toBeGreaterThanOrEqual(88);
    expect(getPairScore("INFJ", "ENTP")).toBeGreaterThanOrEqual(88);
    expect(getPairScore("INFP", "ENFJ")).toBeGreaterThanOrEqual(85);
    expect(getPairScore("INFP", "ENTJ")).toBeGreaterThanOrEqual(85);
    expect(getPairScore("INTP", "ENFJ")).toBeGreaterThanOrEqual(85);
  });

  it("treats radical opposites as friction or clash", () => {
    // INFJ-ESTJ and ENFP-ISTJ are textbook clashing pairs.
    expect(getPairScore("INFJ", "ESTJ")).toBeLessThanOrEqual(60);
    expect(getPairScore("ENFP", "ISTJ")).toBeLessThanOrEqual(60);
  });
});

describe("getPairScore", () => {
  it("is order-independent", () => {
    expect(getPairScore("INFJ", "ENFP")).toBe(getPairScore("ENFP", "INFJ"));
    expect(getPairScore("ESTJ", "ISFP")).toBe(getPairScore("ISFP", "ESTJ"));
  });
});

describe("getPairLabel", () => {
  it("buckets by score range", () => {
    expect(getPairLabel(95)).toBe("golden complementary");
    expect(getPairLabel(82)).toBe("high compatibility");
    expect(getPairLabel(65)).toBe("moderate");
    expect(getPairLabel(50)).toBe("friction");
    expect(getPairLabel(30)).toBe("clash");
  });

  it("handles boundary values", () => {
    expect(getPairLabel(90)).toBe("golden complementary");
    expect(getPairLabel(75)).toBe("high compatibility");
    expect(getPairLabel(60)).toBe("moderate");
    expect(getPairLabel(45)).toBe("friction");
    expect(getPairLabel(44)).toBe("clash");
  });
});

describe("isGoldenPair", () => {
  it("is true at and above 88", () => {
    expect(isGoldenPair(88)).toBe(true);
    expect(isGoldenPair(92)).toBe(true);
    expect(isGoldenPair(100)).toBe(true);
  });

  it("is false below 88", () => {
    expect(isGoldenPair(87)).toBe(false);
    expect(isGoldenPair(75)).toBe(false);
    expect(isGoldenPair(0)).toBe(false);
  });
});
