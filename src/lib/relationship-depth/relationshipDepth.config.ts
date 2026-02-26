/**
 * FAS – Relationship Depth Visual System
 * Single source of truth for relationship-level border and accent styles.
 * Use this config everywhere; no inline conditional border/accent classes.
 */

export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

export interface RelationshipLevelStyle {
  border: string;
  accent?: string;
}

export const RELATIONSHIP_LEVEL_STYLES: Record<RelationshipLevel, RelationshipLevelStyle> = {
  1: { border: "", accent: "none" },
  2: { border: "border-border", accent: "subtle" },
  3: { border: "border-l-4 border-l-primary/40" },
  4: { border: "border-l-4 border-l-primary" },
  5: { border: "border-l-4 border-l-primary shadow-sm" },
};

export function getRelationshipBorder(level: RelationshipLevel | null | undefined): string {
  if (level == null) return "";
  return RELATIONSHIP_LEVEL_STYLES[level].border ?? "";
}
