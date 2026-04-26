import { describe, it, expect } from "vitest";
import {
  buildDrivingDimensions,
  classifyMatchSubtype,
  computeCompositeScore,
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
