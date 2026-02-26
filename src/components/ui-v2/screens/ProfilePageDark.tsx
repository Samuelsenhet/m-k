import { MapPin, Edit2, ChevronDown } from "lucide-react";
import { ARCHETYPES } from "../badge/ArchetypeBadge";
import type { ArchetypeKey } from "../badge/ArchetypeBadge";
import { COLORS } from "@/design/tokens";

/** Archetype display fallback when not in ARCHETYPES (e.g. debattoren, vardaren). */
const ARCHETYPE_FALLBACKS: Record<string, { name: string; emoji: string }> = {
  debattoren: { name: "Debattören", emoji: "💡" },
  vardaren: { name: "Värdaren", emoji: "💝" },
  strateg: { name: "Strategen", emoji: "🎯" },
};

function getArchetypeDisplay(archetype: string) {
  const key = archetype as ArchetypeKey;
  const fromArch = ARCHETYPES[key];
  if (fromArch) return { name: fromArch.label, emoji: fromArch.emoji };
  return ARCHETYPE_FALLBACKS[archetype] ?? { name: "Byggaren", emoji: "🏗️" };
}

export interface ProfilePageDarkProfile {
  name?: string;
  age?: number;
  height?: string;
  instagram?: string;
  occupation?: string;
  location?: string;
  archetype: string;
  bio?: string;
  interests?: string[];
}

export interface ProfilePageDarkProps {
  profile: ProfilePageDarkProfile;
  onEdit?: () => void;
  onShowMore?: () => void;
}

/**
 * Dark profile view (ProfilePageMaak) – FAS 5.4.
 * Dark background, photo area with gradient, name/age/height, archetype badge, Redigera profil, Visa mer.
 */
export function ProfilePageDark({
  profile,
  onEdit,
  onShowMore,
}: ProfilePageDarkProps) {
  const arch = getArchetypeDisplay(profile.archetype ?? "byggare");

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: COLORS.neutral.dark }}
    >
      {/* Photo section */}
      <div className="relative h-72">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(180deg, ${COLORS.sage[400]} 0%, ${COLORS.sage[500]} 100%)`,
          }}
        >
          <span className="text-8xl" aria-hidden>
            {arch.emoji}
          </span>
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${COLORS.neutral.dark} 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Content overlay */}
      <div className="relative -mt-32 px-6">
        {/* Name */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {profile.name ?? "Samuel Pierre"}
        </h1>

        {/* Age | Height */}
        <p className="text-xl text-white/80 mb-2">
          {profile.age ?? 29} | {profile.height ?? "167 cm"}
        </p>

        {/* Instagram */}
        {profile.instagram && (
          <p className="mb-3" style={{ color: COLORS.primary[300] }}>
            Instagram @{profile.instagram}
          </p>
        )}

        {/* Occupation */}
        <p className="text-lg text-white/90 mb-1">
          {profile.occupation ?? "Entrepenör"}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4" style={{ color: COLORS.neutral.gray }} />
          <span style={{ color: COLORS.neutral.gray }}>
            {profile.location ?? "Spånga, Sverige"}
          </span>
        </div>

        {/* Archetype badge */}
        <div className="mb-6">
          <span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
            style={{ background: COLORS.primary[600], color: COLORS.neutral.white }}
          >
            <span aria-hidden>{arch.emoji}</span>
            {arch.name}
          </span>
        </div>

        {/* Edit profile button */}
        <button
          type="button"
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl font-medium mb-4 border"
          style={{
            background: "rgba(255,255,255,0.1)",
            borderColor: "rgba(255,255,255,0.2)",
            color: "white",
          }}
        >
          <Edit2 className="w-5 h-5" />
          Redigera profil
        </button>

        {/* Visa mer */}
        <button
          type="button"
          onClick={onShowMore}
          className="w-full flex items-center justify-center gap-2 py-3"
          style={{ color: COLORS.neutral.gray }}
        >
          <ChevronDown className="w-5 h-5" />
          Visa mer
        </button>
      </div>
    </div>
  );
}
