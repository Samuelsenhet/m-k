import { ARCHETYPE_INFO, type ArchetypeCode } from '@/types/personality';

/** Trim + uppercase; return code only if it exists in ARCHETYPE_INFO (avoids broken sheet/grid from bad DB strings). */
export function normalizeArchetypeCode(raw: unknown): ArchetypeCode | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (code in ARCHETYPE_INFO) return code as ArchetypeCode;
  return null;
}
