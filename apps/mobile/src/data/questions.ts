import type { Question, DimensionKey } from "@maak/core";
import type { TFunction } from "i18next";

const DIMENSION_ORDER: DimensionKey[] = ["ei", "sn", "tf", "jp", "at"];

/** Stable ids and dimensions for the 30-question test (text from i18n `personality_test_questions.qN`). */
export const QUESTION_SHELLS: { id: number; dimension: DimensionKey }[] = Array.from(
  { length: 30 },
  (_, i) => ({
    id: i + 1,
    dimension: DIMENSION_ORDER[Math.floor(i / 6)]!,
  }),
);

export function buildPersonalityQuestions(t: TFunction): Question[] {
  return QUESTION_SHELLS.map((q) => ({
    ...q,
    text: t(`personality_test_questions.q${q.id}`),
  }));
}
