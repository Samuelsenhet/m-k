import { describe, it, expect } from "vitest";
import {
  buildDrivingDimensions,
  classifyMatchSubtype,
  computeCompositeScore,
  cosineSimilarity,
  geoScore,
  interestOverlap,
  balanceBatch,
} from "../match-classifier";
import type { MatchSubtype } from "../match-types";
import type { DimensionKey } from "../personality";

type Scores = Record<DimensionKey, number>;

const NEAR: Scores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };
const ALSO_NEAR: Scores = { ei: 55, sn: 60, tf: 55, jp: 50, at: 60 };

describe("classifyMatchSubtype", () => {
  it("returns 'similar' when all dimensions are within friction threshold", () => {
    expect(classifyMatchSubtype(NEAR, ALSO_NEAR)).toBe("similar");
  });

  it("returns 'growth' when 1 friction dim includes tf", () => {
    const yours: Scores = { ei: 50, sn: 50, tf: 30, jp: 50, at: 50 };
    const theirs: Scores = { ei: 50, sn: 50, tf: 80, jp: 50, at: 50 }; // tf gap = 50
    expect(classifyMatchSubtype(yours, theirs)).toBe("growth");
  });

  it("returns 'growth' when 2 friction dims include at", () => {
    const yours: Scores = { ei: 30, sn: 50, tf: 50, jp: 50, at: 30 };
    const theirs: Scores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 80 }; // ei=20 (under), at=50 (over)
    // Only at is friction here; classified as growth.
    expect(classifyMatchSubtype(yours, theirs)).toBe("growth");
  });

  it("returns 'complementary' when ei + sn + jp diverge but tf + at match", () => {
    const yours: Scores = { ei: 20, sn: 20, tf: 50, jp: 20, at: 50 };
    const theirs: Scores = { ei: 80, sn: 80, tf: 50, jp: 80, at: 50 };
    expect(classifyMatchSubtype(yours, theirs)).toBe("complementary");
  });

  it("falls back to 'similar' when criteria don't match (degenerate edge)", () => {
    // Three frictions, none of tf/at — doesn't fit growth or pure complementary.
    const yours: Scores = { ei: 10, sn: 10, tf: 50, jp: 10, at: 50 };
    const theirs: Scores = { ei: 90, sn: 90, tf: 50, jp: 90, at: 50 };
    // Three frictions in {ei, sn, jp}, tf+at match → complementary
    expect(classifyMatchSubtype(yours, theirs)).toBe("complementary");
  });

  it("returns 'similar' when only sn diverges slightly (no tf/at and only 1 dim)", () => {
    // 1 friction in sn, none of tf/at — neither growth nor complementary; falls back.
    const yours: Scores = { ei: 50, sn: 20, tf: 50, jp: 50, at: 50 };
    const theirs: Scores = { ei: 50, sn: 80, tf: 50, jp: 50, at: 50 };
    expect(classifyMatchSubtype(yours, theirs)).toBe("similar");
  });
});

describe("buildDrivingDimensions", () => {
  it("returns all 5 dimensions sorted by impact (high before medium/low)", () => {
    // ei diff = 60 (high), the rest are 0 (low). ei must come first.
    const yours: Scores = { ei: 20, sn: 50, tf: 50, jp: 50, at: 50 };
    const theirs: Scores = { ei: 80, sn: 50, tf: 50, jp: 50, at: 50 };
    const result = buildDrivingDimensions(yours, theirs);
    expect(result).toHaveLength(5);
    expect(result[0].dim).toBe("ei");
    expect(result[0].impact).toBe("high");
  });

  it("breaks impact ties via tf/at priority (sensitive dims first)", () => {
    // tf and ei both medium impact (diff 30). tf wins on tie-breaker.
    const yours: Scores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };
    const theirs: Scores = { ei: 80, sn: 50, tf: 80, jp: 50, at: 50 };
    const result = buildDrivingDimensions(yours, theirs);
    expect(result[0].dim).toBe("tf");
  });

  it("marks low-distance tf as medium impact (sensitive dim bump)", () => {
    const yours: Scores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };
    const theirs: Scores = { ei: 50, sn: 50, tf: 65, jp: 50, at: 50 };
    const tf = buildDrivingDimensions(yours, theirs).find((d) => d.dim === "tf")!;
    expect(tf.impact).toBe("medium"); // distance 15 normally low, but tf is sensitive
  });

  it("uses 'similar' alignment when distance <= friction threshold", () => {
    const yours: Scores = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };
    const theirs: Scores = { ei: 60, sn: 70, tf: 55, jp: 50, at: 60 };
    const result = buildDrivingDimensions(yours, theirs);
    for (const r of result) {
      expect(r.alignment).toBe("similar");
    }
  });

  it("uses 'complementary' alignment when distance > friction threshold", () => {
    const yours: Scores = { ei: 20, sn: 20, tf: 20, jp: 20, at: 20 };
    const theirs: Scores = { ei: 80, sn: 80, tf: 80, jp: 80, at: 80 };
    const result = buildDrivingDimensions(yours, theirs);
    for (const r of result) {
      expect(r.alignment).toBe("complementary");
    }
  });
});

describe("interestOverlap", () => {
  it("returns 100 when one set is fully contained in the other", () => {
    expect(interestOverlap(["yoga"], ["yoga", "running"])).toBe(100);
  });

  it("is case-insensitive", () => {
    expect(interestOverlap(["Yoga"], ["yoga"])).toBe(100);
  });

  it("returns 50 (neutral) for empty sides", () => {
    expect(interestOverlap([], ["a"])).toBe(50);
    expect(interestOverlap(["a"], [])).toBe(50);
    expect(interestOverlap(undefined, ["a"])).toBe(50);
  });

  it("returns 0 when no overlap", () => {
    expect(interestOverlap(["a", "b"], ["c", "d"])).toBe(0);
  });
});

describe("geoScore", () => {
  it("returns 100 for identical ages", () => {
    expect(geoScore(28, 28)).toBe(100);
  });

  it("decays linearly", () => {
    expect(geoScore(28, 33)).toBe(75);
    expect(geoScore(28, 38)).toBe(50);
  });

  it("clamps to 0 for very large gaps", () => {
    expect(geoScore(28, 60)).toBe(0);
  });

  it("returns 50 (neutral) when an age is missing", () => {
    expect(geoScore(undefined, 28)).toBe(50);
    expect(geoScore(28, undefined)).toBe(50);
  });
});

describe("computeCompositeScore", () => {
  it("applies the 45/25/15/10/5 weights", () => {
    const result = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
    });
    expect(result.total).toBe(95); // no complementary bonus on similar
    expect(result.breakdown.personality).toBe(100);
    expect(result.breakdown.complementary_bonus).toBe(0);
  });

  it("adds 5-point complementary bonus for golden complementary", () => {
    const result = computeCompositeScore({
      personality: 80,
      archetype: 92,
      interests: 60,
      geo: 75,
      subtype: "complementary",
    });
    // 0.45*80 + 0.25*92 + 0.15*60 + 0.10*75 + 0.05*100 = 36 + 23 + 9 + 7.5 + 5 = 80.5 → 81
    expect(result.total).toBe(81);
    expect(result.breakdown.complementary_bonus).toBe(100);
  });

  it("does NOT add the complementary bonus for non-golden complementary pairs", () => {
    const result = computeCompositeScore({
      personality: 80,
      archetype: 70,
      interests: 60,
      geo: 75,
      subtype: "complementary",
    });
    expect(result.breakdown.complementary_bonus).toBe(0);
  });

  it("does NOT add the bonus for similar/growth even on a 'golden' archetype", () => {
    const a = computeCompositeScore({
      personality: 80,
      archetype: 92,
      interests: 60,
      geo: 75,
      subtype: "similar",
    });
    const b = computeCompositeScore({
      personality: 80,
      archetype: 92,
      interests: 60,
      geo: 75,
      subtype: "growth",
    });
    expect(a.breakdown.complementary_bonus).toBe(0);
    expect(b.breakdown.complementary_bonus).toBe(0);
  });

  // ---------- synthesis-mode (Monster Match v1 refit) ----------

  it("activates synthesis weights when BOTH embedding_similarity AND llm_judgment are present", () => {
    // 0.30*100 + 0.20*100 + 0.20*100 + 0.20*100 + 0.05*100 + 0.05*100 = 100
    const result = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
      embedding_similarity: 100,
      llm_judgment: 100,
    });
    expect(result.total).toBe(100);
    expect(result.breakdown.embedding_similarity).toBe(100);
    expect(result.breakdown.llm_judgment).toBe(100);
  });

  it("synthesis formula matches the documented 0.30/0.20/0.20/0.20/0.05/0.05 weights", () => {
    // Real-world case from prod verification 2026-04-28:
    // personality=75, archetype=76, embedding=79, llm=71, interests=50, geo=90
    // 0.30*75 + 0.20*76 + 0.20*79 + 0.20*71 + 0.05*50 + 0.05*90
    //  = 22.5 + 15.2 + 15.8 + 14.2 + 2.5 + 4.5 = 74.7 → 75
    const result = computeCompositeScore({
      personality: 75,
      archetype: 76,
      interests: 50,
      geo: 90,
      subtype: "similar",
      embedding_similarity: 79,
      llm_judgment: 71,
    });
    expect(result.total).toBe(75);
  });

  it("falls back to v1 weights when only embedding_similarity is provided", () => {
    // No llm_judgment → v1 formula. Should match the "all 100s, no bonus" case.
    const synthesisOnly = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
      embedding_similarity: 100,
    });
    const v1 = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
    });
    expect(synthesisOnly.total).toBe(v1.total);
    // The signal is still recorded in the breakdown for observability.
    expect(synthesisOnly.breakdown.embedding_similarity).toBe(100);
    expect(synthesisOnly.breakdown.llm_judgment).toBeNull();
  });

  it("falls back to v1 weights when only llm_judgment is provided", () => {
    const llmOnly = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
      llm_judgment: 100,
    });
    const v1 = computeCompositeScore({
      personality: 100,
      archetype: 100,
      interests: 100,
      geo: 100,
      subtype: "similar",
    });
    expect(llmOnly.total).toBe(v1.total);
    expect(llmOnly.breakdown.llm_judgment).toBe(100);
    expect(llmOnly.breakdown.embedding_similarity).toBeNull();
  });

  it("treats null synthesis signals the same as missing", () => {
    const explicitNull = computeCompositeScore({
      personality: 50,
      archetype: 50,
      interests: 50,
      geo: 50,
      subtype: "similar",
      embedding_similarity: null,
      llm_judgment: null,
    });
    const missing = computeCompositeScore({
      personality: 50,
      archetype: 50,
      interests: 50,
      geo: 50,
      subtype: "similar",
    });
    expect(explicitNull.total).toBe(missing.total);
  });

  it("preserves all signals in the breakdown regardless of which formula ran", () => {
    const result = computeCompositeScore({
      personality: 60,
      archetype: 70,
      interests: 80,
      geo: 90,
      subtype: "complementary",
      embedding_similarity: 65,
      llm_judgment: 75,
    });
    expect(result.breakdown.personality).toBe(60);
    expect(result.breakdown.archetype_pair).toBe(70);
    expect(result.breakdown.interests).toBe(80);
    expect(result.breakdown.geo).toBe(90);
    expect(result.breakdown.embedding_similarity).toBe(65);
    expect(result.breakdown.llm_judgment).toBe(75);
  });
});

describe("cosineSimilarity", () => {
  it("returns 100 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBe(100);
  });

  it("returns 100 for any positive scalar multiple", () => {
    // Scaling preserves direction → cosine = 1 → maps to 100.
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBe(100);
  });

  it("returns 0 for opposite-direction vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBe(0);
  });

  it("returns 50 for orthogonal vectors", () => {
    // cos = 0 → maps to 50 (neutral midpoint).
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(50);
  });

  it("falls back to 50 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(50);
  });

  it("falls back to 50 for empty inputs", () => {
    expect(cosineSimilarity([], [])).toBe(50);
  });

  it("falls back to 50 when either vector is the zero vector", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(50);
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(50);
  });

  it("clamps to [0, 100] (sanity for floating-point edge cases)", () => {
    // High-dim self-similarity from a real embedding-style vector.
    const v = Array.from({ length: 1536 }, (_, i) => Math.sin(i / 100));
    expect(cosineSimilarity(v, v)).toBe(100);
  });

  it("gives a moderate score for partially-aligned vectors", () => {
    // 45° between [1,0] and [1,1] → cos ≈ 0.707 → ((0.707+1)/2)*100 ≈ 85
    expect(cosineSimilarity([1, 0], [1, 1])).toBe(85);
  });
});

describe("balanceBatch", () => {
  function fakeScored(subtype: MatchSubtype, score: number, label: string) {
    return { candidate: label, subtype, score };
  }

  it("returns empty for empty input", () => {
    expect(balanceBatch([], 10)).toEqual([]);
  });

  it("hits ~50/35/15 target when all subtypes have enough", () => {
    const scored = [
      ...Array.from({ length: 10 }, (_, i) => fakeScored("similar", 90 - i, `s${i}`)),
      ...Array.from({ length: 10 }, (_, i) => fakeScored("complementary", 80 - i, `c${i}`)),
      ...Array.from({ length: 10 }, (_, i) => fakeScored("growth", 70 - i, `g${i}`)),
    ];
    const out = balanceBatch(scored, 10);
    expect(out).toHaveLength(10);
    const counts = { similar: 0, complementary: 0, growth: 0 };
    for (const o of out) counts[o.subtype]++;
    // floor(10*0.5)=5, floor(10*0.35)=3, floor(10*0.15)=1; remainder (1) → similar
    expect(counts.similar).toBe(6);
    expect(counts.complementary).toBe(3);
    expect(counts.growth).toBe(1);
  });

  it("fills from leftovers when one subtype is short", () => {
    const scored = [
      ...Array.from({ length: 10 }, (_, i) => fakeScored("similar", 90 - i, `s${i}`)),
      // No complementary, no growth — all 10 slots must come from similar.
    ];
    const out = balanceBatch(scored, 10);
    expect(out).toHaveLength(10);
    expect(out.every((o) => o.subtype === "similar")).toBe(true);
  });

  it("respects batchSize when fewer total candidates than requested", () => {
    const scored = [
      fakeScored("similar", 90, "s0"),
      fakeScored("complementary", 80, "c0"),
    ];
    const out = balanceBatch(scored, 10);
    expect(out).toHaveLength(2);
  });

  it("picks highest-score candidates within each subtype bucket", () => {
    // batch=3 → targets: similar=1+1remainder=2, complementary=1, growth=0
    // similar bucket (s_high=90, s_mid=70, s_low=50) → top 2 = s_high, s_mid
    // complementary bucket → top 1 = c_high
    // s_low never gets picked because we don't need leftovers.
    const scored = [
      fakeScored("similar", 50, "s_low"),
      fakeScored("similar", 70, "s_mid"),
      fakeScored("similar", 90, "s_high"),
      fakeScored("complementary", 60, "c_mid"),
      fakeScored("complementary", 95, "c_high"),
      fakeScored("growth", 70, "g0"),
    ];
    const out = balanceBatch(scored, 3);
    const labels = out.map((o) => o.candidate);
    expect(labels).toContain("s_high");
    expect(labels).toContain("c_high");
    expect(labels).not.toContain("s_low");
  });
});
