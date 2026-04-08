import { describe, it, expect } from "vitest";
import {
  passesDealbreakers,
  calculateCompositeScore,
  generateUserMatchPool,
  calculateDailyMatches,
  generateMatchReason,
  getDimensionBreakdown,
  calculateSimilarityScore,
  calculateComplementaryScore,
  SCORE_SIGNALS,
  MATCH_RATIO,
} from "../matching";

// ── Helpers ──────────────────────────────────────────────

const baseScores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };

function makeUser(overrides = {}) {
  return {
    userId: "user-1",
    displayName: "Testare",
    category: "DIPLOMAT" as const,
    archetype: "INFJ",
    scores: { ...baseScores },
    interests: ["musik", "matlagning", "vandring"],
    age: 28,
    gender: "female",
    onboardingCompleted: true,
    minAge: 22,
    maxAge: 35,
    interestedIn: "all",
    ...overrides,
  };
}

function makeCandidate(overrides = {}) {
  return {
    userId: "cand-1",
    displayName: "Kandidat",
    category: "DIPLOMAT" as const,
    archetype: "ENFJ",
    scores: { ...baseScores },
    interests: ["musik", "film"],
    age: 30,
    gender: "male",
    onboardingCompleted: true,
    ...overrides,
  };
}

// ── passesDealbreakers ────────────────────────────────────

describe("passesDealbreakers", () => {
  it("passes when all criteria met", () => {
    expect(passesDealbreakers(makeUser(), makeCandidate())).toBe(true);
  });

  it("rejects candidate with onboardingCompleted=false", () => {
    expect(
      passesDealbreakers(makeUser(), makeCandidate({ onboardingCompleted: false }))
    ).toBe(false);
  });

  it("rejects candidate outside age range (too young)", () => {
    expect(
      passesDealbreakers(makeUser({ minAge: 25, maxAge: 35 }), makeCandidate({ age: 20 }))
    ).toBe(false);
  });

  it("rejects candidate outside age range (too old)", () => {
    expect(
      passesDealbreakers(makeUser({ minAge: 25, maxAge: 35 }), makeCandidate({ age: 40 }))
    ).toBe(false);
  });

  it("passes if user has no age preferences", () => {
    expect(
      passesDealbreakers(
        makeUser({ minAge: undefined, maxAge: undefined }),
        makeCandidate({ age: 99 })
      )
    ).toBe(true);
  });

  it("passes if candidate has no age", () => {
    expect(
      passesDealbreakers(makeUser({ minAge: 20, maxAge: 30 }), makeCandidate({ age: undefined }))
    ).toBe(true);
  });

  it("rejects wrong gender when interestedIn is 'men'", () => {
    expect(
      passesDealbreakers(
        makeUser({ interestedIn: "men" }),
        makeCandidate({ gender: "female" })
      )
    ).toBe(false);
  });

  it("passes correct gender when interestedIn is 'women'", () => {
    expect(
      passesDealbreakers(
        makeUser({ interestedIn: "women" }),
        makeCandidate({ gender: "female" })
      )
    ).toBe(true);
  });

  it("passes any gender when interestedIn is 'all'", () => {
    expect(
      passesDealbreakers(
        makeUser({ interestedIn: "all" }),
        makeCandidate({ gender: "non-binary" })
      )
    ).toBe(true);
  });
});

// ── calculateSimilarityScore ──────────────────────────────

describe("calculateSimilarityScore", () => {
  it("returns 100 for identical scores", () => {
    expect(calculateSimilarityScore(baseScores, baseScores)).toBe(100);
  });

  it("returns 0 for maximally different scores", () => {
    const low = { ei: 0, sn: 0, tf: 0, jp: 0, at: 0 };
    const high = { ei: 100, sn: 100, tf: 100, jp: 100, at: 100 };
    expect(calculateSimilarityScore(low, high)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { ei: 20, sn: 80, tf: 40, jp: 60, at: 50 };
    const b = { ei: 70, sn: 30, tf: 90, jp: 10, at: 50 };
    expect(calculateSimilarityScore(a, b)).toBe(calculateSimilarityScore(b, a));
  });
});

// ── calculateComplementaryScore ───────────────────────────

describe("calculateComplementaryScore", () => {
  it("rewards similar EI/AT and moderate differences on SN/TF/JP", () => {
    const a = { ei: 60, sn: 30, tf: 30, jp: 30, at: 60 };
    const b = { ei: 60, sn: 65, tf: 65, jp: 65, at: 60 };
    const score = calculateComplementaryScore(a, b);
    expect(score).toBeGreaterThan(70);
  });

  it("is symmetric", () => {
    const a = { ei: 20, sn: 80, tf: 40, jp: 60, at: 50 };
    const b = { ei: 70, sn: 30, tf: 90, jp: 10, at: 50 };
    expect(calculateComplementaryScore(a, b)).toBe(
      calculateComplementaryScore(b, a)
    );
  });
});

// ── calculateCompositeScore ───────────────────────────────

describe("calculateCompositeScore", () => {
  it("returns a total between 0 and 100", () => {
    const { total } = calculateCompositeScore(makeUser(), makeCandidate());
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("breaks down into personality, archetype, interests", () => {
    const { breakdown } = calculateCompositeScore(makeUser(), makeCandidate());
    expect(breakdown).toHaveProperty("personality");
    expect(breakdown).toHaveProperty("archetype");
    expect(breakdown).toHaveProperty("interests");
  });

  it("weights sum to 1.0", () => {
    const sum =
      SCORE_SIGNALS.PERSONALITY_SIMILARITY +
      SCORE_SIGNALS.ARCHETYPE_ALIGNMENT +
      SCORE_SIGNALS.INTEREST_OVERLAP +
      SCORE_SIGNALS.CONVERSATION_ANXIETY_REDUCTION;
    expect(sum).toBe(1.0);
  });

  it("identical profiles score higher than very different ones", () => {
    const user = makeUser();
    const similar = makeCandidate({ scores: { ...user.scores }, archetype: user.archetype, interests: user.interests });
    const different = makeCandidate({
      scores: { ei: 0, sn: 100, tf: 0, jp: 100, at: 0 },
      archetype: "ESTP",
      interests: ["fotboll"],
    });
    const { total: highScore } = calculateCompositeScore(user, similar);
    const { total: lowScore } = calculateCompositeScore(user, different);
    expect(highScore).toBeGreaterThan(lowScore);
  });
});

// ── getDimensionBreakdown ──────────────────────────────────

describe("getDimensionBreakdown", () => {
  it("returns alignment labels for each dimension", () => {
    const result = getDimensionBreakdown(makeUser(), makeCandidate());
    expect(result).toHaveLength(3);
    result.forEach((d) => {
      expect(["high", "medium", "low"]).toContain(d.alignment);
      expect(d.description).toBeTruthy();
    });
  });
});

// ── generateUserMatchPool ─────────────────────────────────

describe("generateUserMatchPool", () => {
  const user = makeUser();

  function makeCandidates(count: number) {
    return Array.from({ length: count }, (_, i) =>
      makeCandidate({
        userId: `cand-${i}`,
        displayName: `Kandidat ${i}`,
        scores: {
          ei: 20 + i * 5,
          sn: 30 + i * 3,
          tf: 40 + i * 2,
          jp: 50 - i * 2,
          at: 50,
        },
        age: 25 + (i % 10),
        interests: i % 2 === 0 ? ["musik", "matlagning"] : ["film", "sport"],
      })
    );
  }

  it("returns empty array when no candidates", () => {
    expect(generateUserMatchPool(user, [], 5)).toEqual([]);
  });

  it("excludes the current user from results", () => {
    const candidates = [makeCandidate({ userId: user.userId })];
    expect(generateUserMatchPool(user, candidates, 5)).toEqual([]);
  });

  it("respects batch size cap", () => {
    const result = generateUserMatchPool(user, makeCandidates(20), 5);
    expect(result).toHaveLength(5);
  });

  it("returns fewer than batch size when not enough candidates", () => {
    const result = generateUserMatchPool(user, makeCandidates(3), 10);
    expect(result).toHaveLength(3);
  });

  it("applies 60/40 similar/complementary ratio", () => {
    const result = generateUserMatchPool(user, makeCandidates(20), 10);
    const similar = result.filter((m) => m.matchType === "similar");
    const complementary = result.filter((m) => m.matchType === "complementary");
    expect(similar.length).toBe(Math.ceil(10 * MATCH_RATIO.SIMILAR));
    expect(complementary.length).toBe(10 - similar.length);
  });

  it("filters out dealbreaker failures", () => {
    const candidates = [
      makeCandidate({ userId: "ok", age: 28 }),
      makeCandidate({ userId: "too-young", age: 18 }),
      makeCandidate({ userId: "incomplete", onboardingCompleted: false }),
    ];
    const result = generateUserMatchPool(user, candidates, 5);
    const ids = result.map((m) => m.user.userId);
    expect(ids).toContain("ok");
    expect(ids).not.toContain("too-young");
    expect(ids).not.toContain("incomplete");
  });

  it("avoids repeat matches when alternatives exist", () => {
    const candidates = makeCandidates(10);
    const previousIds = [candidates[0].userId, candidates[1].userId];
    const result = generateUserMatchPool(user, candidates, 5, previousIds);
    const ids = result.map((m) => m.user.userId);
    previousIds.forEach((prev) => {
      expect(ids).not.toContain(prev);
    });
  });

  it("allows repeats as fallback when no fresh candidates", () => {
    const candidates = makeCandidates(3);
    const previousIds = candidates.map((c) => c.userId);
    const result = generateUserMatchPool(user, candidates, 3, previousIds);
    expect(result.length).toBe(3);
  });

  it("every result has compatibilityFactors", () => {
    const result = generateUserMatchPool(user, makeCandidates(10), 5);
    result.forEach((m) => {
      expect(m.compatibilityFactors.length).toBeGreaterThan(0);
    });
  });
});

// ── calculateDailyMatches (legacy wrapper) ────────────────

describe("calculateDailyMatches", () => {
  it("delegates to generateUserMatchPool", () => {
    const user = makeUser();
    const candidates = [makeCandidate({ userId: "a" }), makeCandidate({ userId: "b" })];
    const result = calculateDailyMatches(user, candidates, 2);
    expect(result).toHaveLength(2);
  });
});

// ── generateMatchReason ───────────────────────────────────

describe("generateMatchReason", () => {
  it("returns correct text for similar match", () => {
    const reason = generateMatchReason("similar");
    expect(reason).toContain("60%");
    expect(reason).toContain("liknande");
  });

  it("returns correct text for complementary match", () => {
    const reason = generateMatchReason("complementary");
    expect(reason).toContain("40%");
    expect(reason).toContain("kompletterande");
  });
});
