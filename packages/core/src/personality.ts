/** Shared personality-test types, labels, and scoring — used by web, mobile, and tooling. */

export type DimensionKey = "ei" | "sn" | "tf" | "jp" | "at";

export type PersonalityCategory =
  | "DIPLOMAT"
  | "STRATEGER"
  | "BYGGARE"
  | "UPPTÄCKARE";

export type ArchetypeCode =
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

export type Question = {
  id: number;
  text: string;
  dimension: DimensionKey;
};

export type PersonalityTestResult = {
  scores: Record<DimensionKey, number>;
  category: PersonalityCategory;
  archetype: ArchetypeCode;
  answers: number[];
};

export type ArchetypeInfo = {
  name: ArchetypeCode;
  emoji: string;
  title: string;
  description: string;
  loveStyle: string;
  strengths: string[];
  category: PersonalityCategory;
};

export const DIMENSION_LABELS: Record<
  DimensionKey,
  { left: string; right: string }
> = {
  ei: { left: "Introvert", right: "Extrovert" },
  sn: { left: "Sensing", right: "Intuition" },
  tf: { left: "Thinking", right: "Feeling" },
  jp: { left: "Judging", right: "Perceiving" },
  at: { left: "Turbulent", right: "Assertive" },
};

export const CATEGORY_INFO: Record<
  PersonalityCategory,
  { emoji: string; title: string; description: string; tips: string[] }
> = {
  DIPLOMAT: {
    emoji: "🕊️",
    title: "Diplomats",
    description:
      "Empathetic and warm; you value deep relationships, meaning, and harmony.",
    tips: [
      "Be clear about needs early so chemistry isn’t only in your head.",
      "Protect your energy — not every chat has to go deep on day one.",
      "Ask one thoughtful follow-up instead of many surface questions.",
      "Celebrate small wins in dating; depth grows with trust.",
    ],
  },
  STRATEGER: {
    emoji: "🎯",
    title: "Strategists",
    description:
      "Analytical and goal-oriented; you see patterns and like a clear direction.",
    tips: [
      "Share one feeling, not only a plan — warmth lands faster than efficiency.",
      "Leave room for spontaneity; rigid timelines can block chemistry.",
      "Explain your ‘why’ when you suggest a next step.",
      "Listen for values, not only logic, in the other person’s story.",
    ],
  },
  BYGGARE: {
    emoji: "🏗️",
    title: "Builders",
    description:
      "Practical and reliable; you show care through consistency and responsibility.",
    tips: [
      "Say what you appreciate out loud — loyalty shines when it’s named.",
      "Try one new experience together; routine plus novelty keeps spark.",
      "Don’t over-function; invite the other person to co-create plans.",
      "Small dependable gestures beat rare grand gestures over time.",
    ],
  },
  UPPTÄCKARE: {
    emoji: "🌟",
    title: "Explorers",
    description:
      "Spontaneous and adventurous; you love variety, motion, and lived experience.",
    tips: [
      "Pause to check in emotionally between adventures.",
      "One calm date can deepen trust after high-energy ones.",
      "Name what you want next week, not only tonight.",
      "Humor is great — add one sincere line so they feel seen.",
    ],
  },
};

export const ARCHETYPE_CODES_BY_CATEGORY: Record<
  PersonalityCategory,
  ArchetypeCode[]
> = {
  DIPLOMAT: ["INFJ", "INFP", "ENFJ", "ENFP"],
  STRATEGER: ["INTJ", "INTP", "ENTJ", "ENTP"],
  BYGGARE: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  UPPTÄCKARE: ["ISTP", "ISFP", "ESTP", "ESFP"],
};

export const ARCHETYPE_INFO: Record<ArchetypeCode, ArchetypeInfo> = {
  INFJ: {
    name: "INFJ",
    emoji: "🦋",
    title: "The Advocate",
    description:
      "Quiet and mysterious, yet inspiring and relentlessly idealistic.",
    loveStyle: "Seeks deep, meaningful connections",
    strengths: ["Deep empathy", "Creative vision", "Passionate"],
    category: "DIPLOMAT",
  },
  INFP: {
    name: "INFP",
    emoji: "🌸",
    title: "The Mediator",
    description:
      "Poetic, kind and altruistic, always eager to help a good cause.",
    loveStyle: "Dreams of perfect romance",
    strengths: ["Creativity", "Empathy", "Authenticity"],
    category: "DIPLOMAT",
  },
  ENFJ: {
    name: "ENFJ",
    emoji: "🌟",
    title: "The Protagonist",
    description:
      "Charismatic and inspiring leader, able to mesmerize listeners.",
    loveStyle: "Gives everything in relationships; deeply devoted",
    strengths: ["Charisma", "Natural leader", "Generous"],
    category: "DIPLOMAT",
  },
  ENFP: {
    name: "ENFP",
    emoji: "🎭",
    title: "The Campaigner",
    description:
      "Enthusiastic, creative and free-spirited; always finds a reason to smile.",
    loveStyle: "Passionate and spontaneous in love",
    strengths: ["Creativity", "Enthusiasm", "People skills"],
    category: "DIPLOMAT",
  },
  INTJ: {
    name: "INTJ",
    /** Arkitekten – classical building in reference UI */
    emoji: "🏛️",
    title: "The Architect",
    description: "Imaginative and strategic thinker with a plan for everything.",
    loveStyle: "Seeks intellectual partners",
    strengths: ["Strategic", "Independent", "Decisive"],
    category: "STRATEGER",
  },
  INTP: {
    name: "INTP",
    emoji: "🔬",
    title: "The Logician",
    description:
      "Innovative inventor with an unquenchable thirst for knowledge.",
    loveStyle: "Values intellectual stimulation",
    strengths: ["Logic", "Objectivity", "Innovation"],
    category: "STRATEGER",
  },
  ENTJ: {
    name: "ENTJ",
    emoji: "⚔️",
    title: "The Commander",
    description:
      "Bold, imaginative and strong-willed leader who always finds a way.",
    loveStyle: "Ambitious and committed partner",
    strengths: ["Leadership", "Strategic", "Efficient"],
    category: "STRATEGER",
  },
  ENTP: {
    name: "ENTP",
    emoji: "💡",
    title: "The Debater",
    description:
      "Smart and curious thinker who cannot resist an intellectual challenge.",
    loveStyle: "Loves intellectual challenge in relationships",
    strengths: ["Quick-witted", "Creative", "Charismatic"],
    category: "STRATEGER",
  },
  ISTJ: {
    name: "ISTJ",
    emoji: "📋",
    title: "The Logistician",
    description: "Practical and fact-minded; reliability is beyond doubt.",
    loveStyle: "Loyal and steady in relationships",
    strengths: ["Reliable", "Organized", "Loyal"],
    category: "BYGGARE",
  },
  ISFJ: {
    name: "ISFJ",
    emoji: "🛡️",
    title: "The Defender",
    description:
      "Dedicated and warm protector, always ready to defend loved ones.",
    loveStyle: "Deeply nurturing and loving",
    strengths: ["Caring", "Loyal", "Reliable"],
    category: "BYGGARE",
  },
  ESTJ: {
    name: "ESTJ",
    emoji: "👔",
    title: "The Executive",
    description:
      "Excellent administrator; unsurpassed at managing things or people.",
    loveStyle: "Reliable and committed in long-term relationships",
    strengths: ["Organization", "Leadership", "Direct"],
    category: "BYGGARE",
  },
  ESFJ: {
    name: "ESFJ",
    emoji: "🤝",
    title: "The Consul",
    description:
      "Extraordinarily caring, social and popular; always eager to help.",
    loveStyle: "Wants to create harmony and warmth",
    strengths: ["Social", "Caring", "Loyal"],
    category: "BYGGARE",
  },
  ISTP: {
    name: "ISTP",
    emoji: "🔧",
    title: "The Virtuoso",
    description:
      "Bold and practical experimenter; master of all kinds of tools.",
    loveStyle: "Laid-back but loyal partner",
    strengths: ["Practical", "Problem solver", "Independent"],
    category: "UPPTÄCKARE",
  },
  ISFP: {
    name: "ISFP",
    emoji: "🎨",
    title: "The Adventurer",
    description:
      "Flexible and charming artist, always ready to explore something new.",
    loveStyle: "Romantic and passionate",
    strengths: ["Creativity", "Spontaneity", "Sensitivity"],
    category: "UPPTÄCKARE",
  },
  ESTP: {
    name: "ESTP",
    /** Entreprenören – die in reference UI */
    emoji: "🎲",
    title: "The Entrepreneur",
    description:
      "Smart, energetic and perceptive; truly lives on the edge.",
    loveStyle: "Exciting and spontaneous in love",
    strengths: ["Energetic", "Perceptive", "Direct"],
    category: "UPPTÄCKARE",
  },
  ESFP: {
    name: "ESFP",
    emoji: "🥳",
    title: "The Entertainer",
    description:
      "Spontaneous, energetic and enthusiastic — life of the party.",
    loveStyle: "Generous and fun partner",
    strengths: ["Energy", "Positivity", "Social"],
    category: "UPPTÄCKARE",
  },
};

/** Maps Likert-derived 0–100 scores to a 4-letter type (higher = E, S, T, J per question wording). */
export function calculateArchetype(
  scores: Record<DimensionKey, number>,
): ArchetypeCode {
  const e = scores.ei >= 50 ? "E" : "I";
  const s = scores.sn >= 50 ? "S" : "N";
  const t = scores.tf >= 50 ? "T" : "F";
  const j = scores.jp >= 50 ? "J" : "P";
  return `${e}${s}${t}${j}` as ArchetypeCode;
}

export function getCategoryFromArchetype(
  archetype: ArchetypeCode,
): PersonalityCategory {
  return ARCHETYPE_INFO[archetype].category;
}

/**
 * Per-dimension weights used by `weightedDistance`. Driven by Monster Match v1
 * spec section 2A: TF (values base) and AT (anxiety compatibility) are
 * weighted high in both modes; EI and SN are weighted lower in similar mode
 * (likeness matters more) and higher in complementary mode (difference is
 * productive). JP stays neutral.
 */
export const DIMENSION_WEIGHTS: Record<
  "similar" | "complementary",
  Record<DimensionKey, number>
> = {
  similar: { ei: 0.8, sn: 0.9, tf: 1.4, jp: 1.0, at: 1.3 },
  complementary: { ei: 1.2, sn: 1.1, tf: 1.4, jp: 1.0, at: 1.3 },
};

/**
 * Weighted Euclidean distance between two personality profiles, normalised to
 * a similarity score 0–100 (100 = identical, 0 = maximum distance).
 *
 * `mode` selects which dimension weights to use:
 *  - "similar"      → reward likeness on every dimension
 *  - "complementary" → tolerate (or favour) difference on EI/SN, still demand
 *                      alignment on TF/AT
 */
export function weightedDistance(
  a: Record<DimensionKey, number>,
  b: Record<DimensionKey, number>,
  mode: "similar" | "complementary" = "similar",
): number {
  const weights = DIMENSION_WEIGHTS[mode];
  const dims: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];

  let sumSq = 0;
  let sumW = 0;
  for (const d of dims) {
    const diff = (a[d] ?? 50) - (b[d] ?? 50);
    sumSq += weights[d] * diff * diff;
    sumW += weights[d];
  }

  // Max possible weighted distance = sqrt(sumW * 100^2) when every dim is
  // at its 100-apart extreme. Normalise to 0–100 similarity score.
  const maxDist = Math.sqrt(sumW * 10000);
  const dist = Math.sqrt(sumSq);
  const similarity = 100 * (1 - dist / maxDist);
  return Math.max(0, Math.min(100, Math.round(similarity)));
}
