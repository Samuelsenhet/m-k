/**
 * Template-based fallback for the LLM voice (Layer 4) when Anthropic is
 * unavailable. Used by `supabase/functions/_shared/llm.ts` after retry fails.
 *
 * The output shape matches `MatchPayloadOutput`. Quality is intentionally
 * lower than the live LLM — strings are pre-written and slot in archetype +
 * dimension labels — but the app keeps working without crashing.
 */

import type { ArchetypeCode, DimensionKey } from "./personality.js";
import type {
  DimensionAlignment,
  MatchContext,
  MatchPayloadOutput,
} from "./match-types.js";

type Locale = "sv" | "en";

const ARCHETYPE_TITLES_SV: Record<ArchetypeCode, string> = {
  INFJ: "Förespråkaren", INFP: "Medlaren", ENFJ: "Protagonisten", ENFP: "Pionjären",
  INTJ: "Arkitekten", INTP: "Logikern", ENTJ: "Befälhavaren", ENTP: "Debattören",
  ISTJ: "Logistikern", ISFJ: "Försvararen", ESTJ: "Verkställaren", ESFJ: "Konsulen",
  ISTP: "Virtuosen", ISFP: "Äventyraren", ESTP: "Entreprenören", ESFP: "Underhållaren",
};

const ARCHETYPE_TITLES_EN: Record<ArchetypeCode, string> = {
  INFJ: "Advocate", INFP: "Mediator", ENFJ: "Protagonist", ENFP: "Campaigner",
  INTJ: "Architect", INTP: "Logician", ENTJ: "Commander", ENTP: "Debater",
  ISTJ: "Logistician", ISFJ: "Defender", ESTJ: "Executive", ESFJ: "Consul",
  ISTP: "Virtuoso", ISFP: "Adventurer", ESTP: "Entrepreneur", ESFP: "Entertainer",
};

const STORY_BY_SUBTYPE: Record<Locale, Record<"similar" | "complementary" | "growth", string>> = {
  sv: {
    similar: "Du och {them} delar samma sätt att se på saker — det märks i {topDim}.",
    complementary: "Du är {yourTitle}, {them} är {theirTitle}. Era olikheter på {topDim} kan bli en av era styrkor.",
    growth: "Du och {them} möts på det viktiga, men ni utmanar varandra på {topDim} — den friktionen kan göra er bättre.",
  },
  en: {
    similar: "You and {them} see the world in similar ways — it shows on {topDim}.",
    complementary: "You're a {yourTitle}, they're a {theirTitle}. Your differences on {topDim} can become one of your strengths.",
    growth: "You meet on what matters, but you challenge each other on {topDim} — that friction can make you both better.",
  },
};

const DIM_LABELS: Record<Locale, Record<DimensionKey, string>> = {
  sv: {
    ei: "energi", sn: "informationsstil", tf: "värderingsbas", jp: "beslutsstil", at: "ångestkompatibilitet",
  },
  en: {
    ei: "energy", sn: "information style", tf: "values", jp: "decision style", at: "anxiety compatibility",
  },
};

const DIM_TEXT: Record<Locale, Record<DimensionKey, Record<DimensionAlignment, string>>> = {
  sv: {
    ei: {
      similar: "Ni laddar och tappar energi på samma sätt — det blir lätt att hitta gemensam rytm.",
      complementary: "Ni har olika energinivåer; det kan balansera varandra om ni respekterar utrymmet.",
    },
    sn: {
      similar: "Ni tar in världen på samma sätt — detaljer eller helhet, ni är synkade.",
      complementary: "En av er ser detaljerna, den andra mönstret. Tillsammans ser ni allt.",
    },
    tf: {
      similar: "Ni delar samma värderingsbas. Det är grunden för långsiktig tillit.",
      complementary: "Ni vägs olika mellan logik och känsla — diskussioner blir rikare.",
    },
    jp: {
      similar: "Ni planerar livet på samma sätt. Få konflikter om kalendrar.",
      complementary: "En av er strukturerar, den andra håller flexibilitet — balans om ni vill.",
    },
    at: {
      similar: "Ni hanterar oro och stress likartat. Stabilt par-system.",
      complementary: "Era stress-stilar skiljer sig — fördjupad förståelse kan ta tid men ger styrka.",
    },
  },
  en: {
    ei: {
      similar: "You charge and drain energy the same way — easy to find a shared rhythm.",
      complementary: "Different energy levels; can balance each other if you respect each other's space.",
    },
    sn: {
      similar: "You take in the world the same way — details or big picture, you're in sync.",
      complementary: "One of you sees details, the other patterns. Together you see everything.",
    },
    tf: {
      similar: "You share the same values base. The foundation of long-term trust.",
      complementary: "You weigh logic and feeling differently — discussions get richer.",
    },
    jp: {
      similar: "You plan life the same way. Few calendar conflicts.",
      complementary: "One of you structures, the other keeps flexibility — balance if you want it.",
    },
    at: {
      similar: "You handle worry and stress similarly. Steady pair-system.",
      complementary: "Your stress styles differ — deeper understanding takes time but builds strength.",
    },
  },
};

const ICEBREAKERS_SV: string[] = [
  "Vad får dig att skratta så där där tårarna kommer?",
  "Om du fick välja en plats att vakna på imorgon — var?",
  "Vad gjorde dig nyfiken senast?",
  "Vad är något du är konstig på, på ett bra sätt?",
  "Söndagar — lugnt och böcker, eller äventyr ut?",
  "Vad är ditt värsta dejt-skämt? (Använd det inte här.)",
];

const ICEBREAKERS_EN: string[] = [
  "What makes you laugh until you tear up?",
  "If you could wake up anywhere tomorrow, where?",
  "What made you curious recently?",
  "What's something you're weird about, in a good way?",
  "Sundays — quiet and books, or out on adventures?",
  "What's your worst dating joke? (Don't use it here.)",
];

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function pickIcebreakers(
  seed: string,
  pool: string[],
  count: number,
): string[] {
  // Deterministic-ish: use the seed (e.g. archetype pair) to rotate the pool.
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const start = h % pool.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

/**
 * Generate a `MatchPayloadOutput` purely from the math payload + locale,
 * without calling any LLM. Used as the failure path of the LLM wrapper.
 */
export function generateFallbackOutput(
  context: MatchContext,
): MatchPayloadOutput {
  const { payload, viewer_archetype, candidate_display_name, locale } = context;
  const titles = locale === "sv" ? ARCHETYPE_TITLES_SV : ARCHETYPE_TITLES_EN;
  const dimText = DIM_TEXT[locale];
  const dimLabels = DIM_LABELS[locale];
  const stories = STORY_BY_SUBTYPE[locale];
  const pool = locale === "sv" ? ICEBREAKERS_SV : ICEBREAKERS_EN;

  const topDim = payload.driving_dimensions[0];
  const topDimLabel = topDim ? dimLabels[topDim.dim] : dimLabels.tf;

  const story = fill(stories[payload.match_subtype], {
    them: candidate_display_name,
    yourTitle: titles[viewer_archetype],
    theirTitle: titles[payload.archetype_pair.their],
    topDim: topDimLabel,
  });

  const breakdown = payload.driving_dimensions.slice(0, 3).map((dd) => ({
    dim: dd.dim,
    text: dimText[dd.dim][dd.alignment],
  }));

  const seed = `${viewer_archetype}-${payload.archetype_pair.their}-${payload.match_subtype}`;
  const icebreakers = pickIcebreakers(seed, pool, 3) as [string, string, string];

  return {
    story,
    dimension_breakdown: breakdown,
    icebreakers,
    validation_score: payload.raw_score,
    validation_note:
      locale === "sv"
        ? "Reservläge: ingen oberoende AI-bedömning."
        : "Fallback mode: no independent AI assessment.",
  };
}
