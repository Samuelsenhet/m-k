import { describe, it, expect } from "vitest";
import { generateFallbackOutput } from "../match-fallback";
import type {
  MatchContext,
  MatchPayload,
  MatchSubtype,
} from "../match-types";
import type { ArchetypeCode } from "../personality";

const ALL_ARCHETYPES: ArchetypeCode[] = [
  "INFJ", "INFP", "ENFJ", "ENFP",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const SUBTYPES: MatchSubtype[] = ["similar", "complementary", "growth"];

function makePayload(
  yours: ArchetypeCode,
  theirs: ArchetypeCode,
  subtype: MatchSubtype,
): MatchPayload {
  return {
    user_id: "u-test",
    raw_score: 80,
    match_subtype: subtype,
    driving_dimensions: [
      { dim: "tf", their: 70, your: 65, alignment: "similar", impact: "high" },
      { dim: "ei", their: 30, your: 70, alignment: "complementary", impact: "medium" },
      { dim: "at", their: 60, your: 55, alignment: "similar", impact: "high" },
    ],
    archetype_pair: {
      their: theirs,
      yours,
      pair_score: 85,
      label: "high compatibility",
    },
    signal_breakdown: {
      personality: 78,
      archetype_pair: 85,
      interests: 60,
      geo: 80,
      complementary_bonus: 0,
    },
    shared_interests: ["resor", "böcker"],
    notable_facts: ["båda 28 år"],
  };
}

function makeContext(
  yours: ArchetypeCode,
  theirs: ArchetypeCode,
  subtype: MatchSubtype,
  locale: "sv" | "en" = "sv",
): MatchContext {
  return {
    payload: makePayload(yours, theirs, subtype),
    viewer_archetype: yours,
    viewer_display_name: "Anna",
    candidate_display_name: "Erik",
    candidate_bio: "Gillar att resa och läsa.",
    locale,
  };
}

describe("generateFallbackOutput", () => {
  it("returns the validation_score from the math payload", () => {
    const ctx = makeContext("INFJ", "ENFP", "complementary");
    const out = generateFallbackOutput(ctx);
    expect(out.validation_score).toBe(ctx.payload.raw_score);
  });

  it("returns exactly 3 icebreakers", () => {
    const ctx = makeContext("INFJ", "ENFP", "complementary");
    const out = generateFallbackOutput(ctx);
    expect(out.icebreakers).toHaveLength(3);
    out.icebreakers.forEach((s) => expect(s.length).toBeGreaterThan(0));
  });

  it("returns up to 3 dimension breakdown entries", () => {
    const ctx = makeContext("INFJ", "ENFP", "complementary");
    const out = generateFallbackOutput(ctx);
    expect(out.dimension_breakdown.length).toBeGreaterThan(0);
    expect(out.dimension_breakdown.length).toBeLessThanOrEqual(3);
    out.dimension_breakdown.forEach((d) => {
      expect(d.dim).toBeTruthy();
      expect(d.text.length).toBeGreaterThan(0);
    });
  });

  it("substitutes the candidate display name into the story", () => {
    const ctx = makeContext("INFJ", "ENFP", "similar");
    const out = generateFallbackOutput(ctx);
    expect(out.story).toContain("Erik");
    expect(out.story).not.toContain("{them}");
  });

  it("produces non-empty output for every archetype × subtype × locale", () => {
    for (const yours of ALL_ARCHETYPES) {
      for (const theirs of ALL_ARCHETYPES) {
        for (const subtype of SUBTYPES) {
          for (const locale of ["sv", "en"] as const) {
            const out = generateFallbackOutput(makeContext(yours, theirs, subtype, locale));
            expect(out.story.length).toBeGreaterThan(0);
            expect(out.icebreakers).toHaveLength(3);
            expect(out.dimension_breakdown.length).toBeGreaterThan(0);
            expect(out.validation_note.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("returns English text for locale=en", () => {
    const ctx = makeContext("INFJ", "ENFP", "complementary", "en");
    const out = generateFallbackOutput(ctx);
    // Heuristic: English fallback note mentions "Fallback".
    expect(out.validation_note.toLowerCase()).toContain("fallback");
  });

  it("returns Swedish text for locale=sv", () => {
    const ctx = makeContext("INFJ", "ENFP", "complementary", "sv");
    const out = generateFallbackOutput(ctx);
    expect(out.validation_note.toLowerCase()).toContain("reservläge");
  });
});
