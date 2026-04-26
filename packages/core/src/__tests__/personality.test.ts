import { describe, it, expect } from "vitest";
import type { DimensionKey, ArchetypeCode, PersonalityCategory } from "../personality";
import {
  calculateArchetype,
  getCategoryFromArchetype,
  ARCHETYPE_INFO,
  ARCHETYPE_CODES_BY_CATEGORY,
  DIMENSION_LABELS,
  DIMENSION_WEIGHTS,
  weightedDistance,
} from "../personality";

describe("calculateArchetype", () => {
  // Mapping: ei>=50→E, sn>=50→S, tf>=50→T, jp>=50→J
  it("returns INFP for low ei, low sn, low tf, low jp", () => {
    expect(
      calculateArchetype({ ei: 30, sn: 20, tf: 30, jp: 30, at: 50 })
    ).toBe("INFP");
  });

  it("returns ENFJ for high ei, low sn, low tf, high jp", () => {
    expect(
      calculateArchetype({ ei: 70, sn: 20, tf: 30, jp: 70, at: 50 })
    ).toBe("ENFJ");
  });

  it("returns ESTP for high ei, high sn, high tf, low jp", () => {
    expect(
      calculateArchetype({ ei: 80, sn: 60, tf: 70, jp: 20, at: 50 })
    ).toBe("ESTP");
  });

  it("returns ISTJ for low ei, high sn, high tf, high jp", () => {
    expect(
      calculateArchetype({ ei: 20, sn: 80, tf: 90, jp: 60, at: 50 })
    ).toBe("ISTJ");
  });

  // Boundary: exactly 50 → E, S, T, J (>= 50)
  it("maps score of exactly 50 to E/S/T/J", () => {
    expect(
      calculateArchetype({ ei: 50, sn: 50, tf: 50, jp: 50, at: 50 })
    ).toBe("ESTJ");
  });

  // Boundary: 49 → I, N, F, P
  it("maps score of 49 to I/N/F/P", () => {
    expect(
      calculateArchetype({ ei: 49, sn: 49, tf: 49, jp: 49, at: 50 })
    ).toBe("INFP");
  });

  // Extremes
  it("maps all-zero scores to INFP", () => {
    expect(
      calculateArchetype({ ei: 0, sn: 0, tf: 0, jp: 0, at: 0 })
    ).toBe("INFP");
  });

  it("maps all-100 scores to ESTJ", () => {
    expect(
      calculateArchetype({ ei: 100, sn: 100, tf: 100, jp: 100, at: 100 })
    ).toBe("ESTJ");
  });

  // All 16 archetypes are reachable
  // ei>=50→E, sn>=50→S, tf>=50→T, jp>=50→J
  it.each<[string, Record<DimensionKey, number>, ArchetypeCode]>([
    ["INFJ", { ei: 10, sn: 10, tf: 10, jp: 90, at: 50 }, "INFJ"],
    ["INFP", { ei: 10, sn: 10, tf: 10, jp: 10, at: 50 }, "INFP"],
    ["ENFJ", { ei: 90, sn: 10, tf: 10, jp: 90, at: 50 }, "ENFJ"],
    ["ENFP", { ei: 90, sn: 10, tf: 10, jp: 10, at: 50 }, "ENFP"],
    ["INTJ", { ei: 10, sn: 10, tf: 90, jp: 90, at: 50 }, "INTJ"],
    ["INTP", { ei: 10, sn: 10, tf: 90, jp: 10, at: 50 }, "INTP"],
    ["ENTJ", { ei: 90, sn: 10, tf: 90, jp: 90, at: 50 }, "ENTJ"],
    ["ENTP", { ei: 90, sn: 10, tf: 90, jp: 10, at: 50 }, "ENTP"],
    ["ISTJ", { ei: 10, sn: 90, tf: 90, jp: 90, at: 50 }, "ISTJ"],
    ["ISFJ", { ei: 10, sn: 90, tf: 10, jp: 90, at: 50 }, "ISFJ"],
    ["ESTJ", { ei: 90, sn: 90, tf: 90, jp: 90, at: 50 }, "ESTJ"],
    ["ESFJ", { ei: 90, sn: 90, tf: 10, jp: 90, at: 50 }, "ESFJ"],
    ["ISTP", { ei: 10, sn: 90, tf: 90, jp: 10, at: 50 }, "ISTP"],
    ["ISFP", { ei: 10, sn: 90, tf: 10, jp: 10, at: 50 }, "ISFP"],
    ["ESTP", { ei: 90, sn: 90, tf: 90, jp: 10, at: 50 }, "ESTP"],
    ["ESFP", { ei: 90, sn: 90, tf: 10, jp: 10, at: 50 }, "ESFP"],
  ])("produces %s", (_label, scores, expected) => {
    expect(calculateArchetype(scores)).toBe(expected);
  });

  it("ignores the 'at' dimension for archetype calculation", () => {
    const base = { ei: 30, sn: 30, tf: 30, jp: 30 };
    expect(calculateArchetype({ ...base, at: 0 })).toBe(
      calculateArchetype({ ...base, at: 100 })
    );
  });
});

describe("getCategoryFromArchetype", () => {
  it.each<[ArchetypeCode, PersonalityCategory]>([
    ["INFJ", "DIPLOMAT"],
    ["INFP", "DIPLOMAT"],
    ["ENFJ", "DIPLOMAT"],
    ["ENFP", "DIPLOMAT"],
    ["INTJ", "STRATEGER"],
    ["INTP", "STRATEGER"],
    ["ENTJ", "STRATEGER"],
    ["ENTP", "STRATEGER"],
    ["ISTJ", "BYGGARE"],
    ["ISFJ", "BYGGARE"],
    ["ESTJ", "BYGGARE"],
    ["ESFJ", "BYGGARE"],
    ["ISTP", "UPPTÄCKARE"],
    ["ISFP", "UPPTÄCKARE"],
    ["ESTP", "UPPTÄCKARE"],
    ["ESFP", "UPPTÄCKARE"],
  ])("%s → %s", (archetype, expectedCategory) => {
    expect(getCategoryFromArchetype(archetype)).toBe(expectedCategory);
  });
});

describe("ARCHETYPE_CODES_BY_CATEGORY consistency", () => {
  it("every archetype in ARCHETYPE_INFO maps to the correct category", () => {
    for (const [code, info] of Object.entries(ARCHETYPE_INFO)) {
      const category = info.category;
      expect(ARCHETYPE_CODES_BY_CATEGORY[category]).toContain(code);
    }
  });

  it("all 16 archetypes are present", () => {
    const allCodes = Object.values(ARCHETYPE_CODES_BY_CATEGORY).flat();
    expect(allCodes).toHaveLength(16);
  });
});

describe("DIMENSION_LABELS", () => {
  it("has all 5 dimensions", () => {
    const dims: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];
    dims.forEach((d) => {
      expect(DIMENSION_LABELS[d]).toBeDefined();
      expect(DIMENSION_LABELS[d].left).toBeTruthy();
      expect(DIMENSION_LABELS[d].right).toBeTruthy();
    });
  });
});

describe("DIMENSION_WEIGHTS", () => {
  it("defines weights for both modes and all 5 dimensions", () => {
    const dims: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];
    for (const mode of ["similar", "complementary"] as const) {
      for (const d of dims) {
        expect(DIMENSION_WEIGHTS[mode][d]).toBeGreaterThan(0);
      }
    }
  });

  it("weights TF and AT high in both modes (values + anxiety base)", () => {
    expect(DIMENSION_WEIGHTS.similar.tf).toBeGreaterThanOrEqual(1.3);
    expect(DIMENSION_WEIGHTS.complementary.tf).toBeGreaterThanOrEqual(1.3);
    expect(DIMENSION_WEIGHTS.similar.at).toBeGreaterThanOrEqual(1.2);
    expect(DIMENSION_WEIGHTS.complementary.at).toBeGreaterThanOrEqual(1.2);
  });

  it("weights EI lower in similar than complementary mode", () => {
    expect(DIMENSION_WEIGHTS.similar.ei).toBeLessThan(
      DIMENSION_WEIGHTS.complementary.ei,
    );
  });
});

describe("weightedDistance", () => {
  const identical: Record<DimensionKey, number> = {
    ei: 50, sn: 50, tf: 50, jp: 50, at: 50,
  };
  const opposite: Record<DimensionKey, number> = {
    ei: 0, sn: 0, tf: 0, jp: 0, at: 0,
  };
  const farOpposite: Record<DimensionKey, number> = {
    ei: 100, sn: 100, tf: 100, jp: 100, at: 100,
  };

  it("returns 100 for identical profiles", () => {
    expect(weightedDistance(identical, identical, "similar")).toBe(100);
    expect(weightedDistance(identical, identical, "complementary")).toBe(100);
  });

  it("returns 0 for maximum-distance profiles", () => {
    expect(weightedDistance(opposite, farOpposite, "similar")).toBe(0);
    expect(weightedDistance(opposite, farOpposite, "complementary")).toBe(0);
  });

  it("returns a value between 0 and 100", () => {
    const a: Record<DimensionKey, number> = { ei: 30, sn: 70, tf: 60, jp: 40, at: 50 };
    const b: Record<DimensionKey, number> = { ei: 60, sn: 40, tf: 50, jp: 70, at: 60 };
    const score = weightedDistance(a, b, "similar");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("is symmetric", () => {
    const a: Record<DimensionKey, number> = { ei: 30, sn: 70, tf: 60, jp: 40, at: 50 };
    const b: Record<DimensionKey, number> = { ei: 60, sn: 40, tf: 50, jp: 70, at: 60 };
    expect(weightedDistance(a, b, "similar")).toBe(weightedDistance(b, a, "similar"));
    expect(weightedDistance(a, b, "complementary")).toBe(
      weightedDistance(b, a, "complementary"),
    );
  });

  it("treats TF differences more harshly than EI differences in similar mode", () => {
    // Same magnitude, different dimensions
    const baseA: Record<DimensionKey, number> = { ei: 50, sn: 50, tf: 50, jp: 50, at: 50 };
    const eiDiff: Record<DimensionKey, number> = { ei: 80, sn: 50, tf: 50, jp: 50, at: 50 };
    const tfDiff: Record<DimensionKey, number> = { ei: 50, sn: 50, tf: 80, jp: 50, at: 50 };
    const eiScore = weightedDistance(baseA, eiDiff, "similar");
    const tfScore = weightedDistance(baseA, tfDiff, "similar");
    // TF mismatch should score lower (more penalty) than EI mismatch.
    expect(tfScore).toBeLessThan(eiScore);
  });
});
