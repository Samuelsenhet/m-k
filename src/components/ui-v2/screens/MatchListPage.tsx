import { useState } from "react";
import { Clock, Heart, Users, Zap, Sparkles } from "lucide-react";
import { MatchListItem } from "../match";
import type { ArchetypeKey } from "../badge/ArchetypeBadge";
import { COLORS } from "@/design/tokens";

export interface MatchListPageMatch {
  name: string;
  archetype: ArchetypeKey;
  emoji?: string;
  /** Used for filter tabs; if omitted, match appears in "Alla" only. */
  matchType?: "likhets" | "motsats";
}

export type MatchListFilter = "alla" | "likhets" | "motsats";

export interface MatchListPageProps {
  matches: MatchListPageMatch[];
  onMatchClick?: (match: MatchListPageMatch) => void;
  onFilterChange?: (filter: MatchListFilter) => void;
  likhetCount?: number;
  motsatsCount?: number;
}

/**
 * Dagens matchningar full-screen view – FAS 5.3.
 * Header, Smart Personlighetsanalys card, match list, filter tabs (Alla / Likhets / Motsats).
 */
export function MatchListPage({
  matches,
  onMatchClick,
  onFilterChange,
  likhetCount = 0,
  motsatsCount = 0,
}: MatchListPageProps) {
  const [activeFilter, setActiveFilter] = useState<MatchListFilter>("alla");

  const handleFilter = (filter: MatchListFilter) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  const filteredMatches =
    activeFilter === "alla"
      ? matches
      : matches.filter((m) => m.matchType === activeFilter);

  return (
    <div className="min-h-screen pb-24" style={{ background: COLORS.neutral.offWhite }}>
      {/* Header */}
      <div className="p-4 pt-6">
        <h1
          className="text-3xl font-bold mb-1 font-heading"
          style={{ color: COLORS.primary[700] }}
        >
          Dagens matchningar
        </h1>
        <p
          className="flex items-center gap-1.5 text-sm"
          style={{ color: COLORS.neutral.gray }}
        >
          <Clock className="w-4 h-4" />
          24h löpande • Kvalitetsfokus
        </p>
      </div>

      {/* Smart Personlighetsanalys card */}
      <div className="px-4 mb-6">
        <div
          className="p-4 rounded-2xl"
          style={{
            background: COLORS.neutral.white,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: COLORS.primary[100] }}
            >
              <Zap className="w-6 h-6" style={{ color: COLORS.primary[600] }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>
                Smart Personlighetsanalys
              </h3>
              <p className="text-sm" style={{ color: COLORS.neutral.gray }}>
                Baserad på 30 frågor • 16 arketyper • 4 kategorier
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{
                borderColor: COLORS.primary[600] + "40",
                color: COLORS.primary[700],
              }}
            >
              <Users className="w-4 h-4" />
              {likhetCount} Likhets
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
              style={{
                borderColor: COLORS.coral[300],
                color: COLORS.coral[600],
              }}
            >
              <Sparkles className="w-4 h-4" />
              {motsatsCount} Motsats
            </span>
          </div>
        </div>
      </div>

      {/* Dina matchningar section */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5" style={{ color: COLORS.sage[400] }} />
          <h2
            className="text-2xl font-semibold font-heading"
            style={{ color: COLORS.primary[700] }}
          >
            Dina matchningar
          </h2>
        </div>

        {/* Match list */}
        <div className="space-y-3 mb-6">
          {filteredMatches.map((match, i) => (
            <MatchListItem
              key={i}
              name={match.name}
              archetype={match.archetype}
              emoji={match.emoji}
              onClick={() => onMatchClick?.(match)}
            />
          ))}
        </div>

        {/* Filter tabs */}
        <div
          className="flex rounded-full p-1"
          style={{ background: COLORS.neutral.cream }}
        >
          {(
            [
              { id: "alla" as const, label: `Alla (${matches.length})` },
              { id: "likhets" as const, label: `👥 Likhets (${likhetCount})` },
              { id: "motsats" as const, label: `✨ Motsats (${motsatsCount})` },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleFilter(filter.id)}
              className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all"
              style={{
                background: activeFilter === filter.id ? COLORS.neutral.white : "transparent",
                color: activeFilter === filter.id ? COLORS.primary[700] : COLORS.neutral.gray,
                boxShadow: activeFilter === filter.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: COLORS.neutral.gray }}>
          Synkflöde + Vågflöde matchningar
        </p>
      </div>
    </div>
  );
}
