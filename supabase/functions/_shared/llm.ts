/**
 * LLM provider abstraction for Monster Match v1.
 *
 * Used by `generate-match-pools` (and eventually `generate-icebreakers`,
 * `ai-assistant`) to produce a `MatchPayloadOutput` per (user, candidate)
 * pair. Provider is selected via the `LLM_PROVIDER` env variable. Default:
 * Anthropic (Claude Haiku).
 *
 * Failure path: 1 retry → template-based fallback → caller sees
 * `fallback_used: true`.
 *
 * Types are intentionally duplicated from packages/core/src/match-types.ts
 * because Deno edge functions can't import npm workspaces. Keep the two
 * files in sync.
 */

// ---------- types (mirror @maak/core/match-types.ts) ----------

export type DimensionKey = "ei" | "sn" | "tf" | "jp" | "at";

export type ArchetypeCode =
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type MatchSubtype = "similar" | "complementary" | "growth";

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
  label: string;
};

export type MatchPayload = {
  user_id: string;
  raw_score: number;
  match_subtype: MatchSubtype;
  driving_dimensions: DrivingDimension[];
  archetype_pair: ArchetypePair;
  signal_breakdown: {
    personality: number;
    archetype_pair: number;
    interests: number;
    geo: number;
    complementary_bonus: number;
  };
  shared_interests: string[];
  notable_facts: string[];
};

export type MatchContext = {
  payload: MatchPayload;
  viewer_archetype: ArchetypeCode;
  viewer_display_name: string;
  candidate_display_name: string;
  candidate_bio: string | null;
  locale: "sv" | "en";
};

export type MatchPayloadOutput = {
  story: string;
  dimension_breakdown: Array<{ dim: DimensionKey; text: string }>;
  icebreakers: [string, string, string];
  validation_score: number;
  validation_note: string;
};

export type GenerateMatchPayloadResult = {
  output: MatchPayloadOutput;
  fallback_used: boolean;
  provider: string;
  latency_ms: number;
};

// ---------- public API ----------

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 800;

/**
 * Run the LLM voice for one match. Tries Anthropic, retries once, falls
 * back to template if both fail.
 */
export async function generateMatchPayload(
  context: MatchContext,
): Promise<GenerateMatchPayloadResult> {
  const provider = (Deno.env.get("LLM_PROVIDER") ?? "anthropic").toLowerCase();
  const start = Date.now();

  if (provider === "anthropic") {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (apiKey) {
      const result = await tryAnthropic(context, apiKey);
      if (result) {
        return {
          output: result,
          fallback_used: false,
          provider: "anthropic",
          latency_ms: Date.now() - start,
        };
      }
    }
  }

  // Fallback path
  return {
    output: generateFallbackOutput(context),
    fallback_used: true,
    provider: "fallback",
    latency_ms: Date.now() - start,
  };
}

/**
 * Cache key for the match_story_cache table. Stable across users with the
 * same archetype-pair and top-2 driving dimensions.
 */
export function buildCacheKey(context: MatchContext): string {
  const top2 = context.payload.driving_dimensions
    .slice(0, 2)
    .map((d) => `${d.dim}:${d.alignment}`)
    .join(",");
  return [
    context.viewer_archetype,
    context.payload.archetype_pair.their,
    top2,
    context.payload.match_subtype,
    context.locale,
  ].join("|");
}

// ---------- Anthropic provider ----------

async function tryAnthropic(
  context: MatchContext,
  apiKey: string,
): Promise<MatchPayloadOutput | null> {
  const systemPrompt = buildSystemPrompt(context.locale);
  const userPrompt = buildUserPrompt(context);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        console.warn(
          `[llm] anthropic attempt ${attempt + 1} failed:`,
          response.status,
        );
        continue;
      }

      const json = await response.json();
      const text = json?.content?.[0]?.text ?? "";
      const parsed = parseLLMOutput(text);
      if (parsed) return parsed;

      console.warn(`[llm] anthropic attempt ${attempt + 1}: invalid JSON`);
    } catch (err) {
      console.warn(`[llm] anthropic attempt ${attempt + 1} crashed:`, err);
    }
  }
  return null;
}

function buildSystemPrompt(locale: "sv" | "en"): string {
  if (locale === "en") {
    return `You are MÄÄK's matching voice. Tone: intimate, honest, specific. Never clichés. Never generic. Translate the structured analysis you receive into human text. Reply ONLY with a JSON object matching the requested schema.`;
  }
  return `Du är MÄÄK:s matchningsröst. Ton: intim, ärlig, specifik. Aldrig klyschor. Aldrig allmänt. Översätt den strukturerade analysen du får till mänsklig text. Svara ENDAST med ett JSON-objekt enligt det begärda schemat.`;
}

function buildUserPrompt(context: MatchContext): string {
  const { payload, viewer_archetype, viewer_display_name, candidate_display_name, candidate_bio, locale } = context;
  const schema = `{
  "story": string (1-2 sentences, ${locale === "sv" ? "Swedish" : "English"}, why these two specifically),
  "dimension_breakdown": Array<{ "dim": "ei"|"sn"|"tf"|"jp"|"at", "text": string (1 sentence) }> (top 3 dimensions),
  "icebreakers": [string, string, string] (3 conversation openers, ${locale === "sv" ? "Swedish" : "English"}),
  "validation_score": number (0-100, your independent compatibility judgment),
  "validation_note": string (1 sentence motivating your score)
}`;

  return [
    `Match analysis for: ${viewer_display_name} (${viewer_archetype}) ↔ ${candidate_display_name} (${payload.archetype_pair.their})`,
    `Subtype: ${payload.match_subtype}`,
    `Math compatibility score: ${payload.raw_score}`,
    `Archetype pair: ${payload.archetype_pair.label} (${payload.archetype_pair.pair_score})`,
    `Driving dimensions:`,
    ...payload.driving_dimensions.map(
      (d) => `  - ${d.dim}: yours=${d.your}, theirs=${d.their}, alignment=${d.alignment}, impact=${d.impact}`,
    ),
    `Shared interests: ${payload.shared_interests.join(", ") || "none"}`,
    `Notable facts: ${payload.notable_facts.join("; ") || "none"}`,
    candidate_bio ? `Candidate bio: ${candidate_bio}` : `Candidate bio: (none)`,
    "",
    `Reply with a JSON object matching this schema (no markdown, no commentary):`,
    schema,
  ].join("\n");
}

function parseLLMOutput(raw: string): MatchPayloadOutput | null {
  // Strip markdown code fences if present
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    const obj = JSON.parse(cleaned);
    if (
      typeof obj?.story === "string" &&
      Array.isArray(obj?.dimension_breakdown) &&
      Array.isArray(obj?.icebreakers) &&
      obj.icebreakers.length >= 3 &&
      typeof obj?.validation_score === "number" &&
      typeof obj?.validation_note === "string"
    ) {
      return {
        story: obj.story,
        dimension_breakdown: obj.dimension_breakdown.slice(0, 5),
        icebreakers: [obj.icebreakers[0], obj.icebreakers[1], obj.icebreakers[2]],
        validation_score: clamp(Math.round(obj.validation_score), 0, 100),
        validation_note: obj.validation_note,
      };
    }
  } catch {
    // fall through
  }
  return null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---------- fallback (mirrors packages/core/src/match-fallback.ts) ----------

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

const STORY_BY_SUBTYPE: Record<"sv" | "en", Record<MatchSubtype, string>> = {
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

const DIM_LABELS: Record<"sv" | "en", Record<DimensionKey, string>> = {
  sv: { ei: "energi", sn: "informationsstil", tf: "värderingsbas", jp: "beslutsstil", at: "ångestkompatibilitet" },
  en: { ei: "energy", sn: "information style", tf: "values", jp: "decision style", at: "anxiety compatibility" },
};

const DIM_TEXT_SV: Record<DimensionKey, Record<DimensionAlignment, string>> = {
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
};

const DIM_TEXT_EN: Record<DimensionKey, Record<DimensionAlignment, string>> = {
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

function pickIcebreakers(seed: string, pool: string[], count: number): string[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const start = h % pool.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[(start + i) % pool.length]);
  return out;
}

function generateFallbackOutput(context: MatchContext): MatchPayloadOutput {
  const { payload, viewer_archetype, candidate_display_name, locale } = context;
  const titles = locale === "sv" ? ARCHETYPE_TITLES_SV : ARCHETYPE_TITLES_EN;
  const dimText = locale === "sv" ? DIM_TEXT_SV : DIM_TEXT_EN;
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
