import { ARCHETYPE_INFO, type ArchetypeCode } from "@maak/core";
import type { TFunction } from "i18next";

/** Localized archetype title, or raw code if unknown (e.g. legacy data). */
export function archetypeDisplayTitle(
  archetype: string | null | undefined,
  t: TFunction,
): string | null {
  if (!archetype) return null;
  if (archetype in ARCHETYPE_INFO) {
    const code = archetype as ArchetypeCode;
    const info = ARCHETYPE_INFO[code];
    return t(`personality.archetypes.${code}.title`, { defaultValue: info.title });
  }
  return archetype;
}
