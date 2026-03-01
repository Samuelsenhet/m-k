import * as React from "react";
import { cn } from "@/lib/utils";
import { CardV2, CardV2Content, CardV2Header } from "../card";
import { ArchetypeBadge, type ArchetypeKey } from "../badge/ArchetypeBadge";
import { MatchTypeBadge, type MatchTypeV2 } from "../badge/MatchTypeBadge";
import { ARCHETYPES } from "../badge/ArchetypeBadge";
import { ActionButtons } from "./ActionButtons";

export interface MatchCardClassicProfile {
  name: string;
  archetype: ArchetypeKey;
  bio?: string;
  traits?: string[];
  quote?: string;
}

export interface MatchCardClassicProps {
  profile: MatchCardClassicProfile;
  matchType?: MatchTypeV2;
  onPass: () => void;
  onChat: () => void;
  onViewProfile: () => void;
  className?: string;
}

/**
 * MÄÄK Classic match card: mini preview, detailed card with bio, traits, quote, Passa/Chatta/Se profil.
 * FAS Relationship Depth: no progress bar or timer visuals.
 */
function MatchCardClassic({
  profile,
  matchType = "likhet",
  onPass,
  onChat,
  onViewProfile,
  className,
}: MatchCardClassicProps) {
  const arch = ARCHETYPES[profile.archetype];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl p-4 flex items-center gap-3 bg-sage-100">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-card">
          {arch?.emoji ?? "👤"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{profile.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <ArchetypeBadge archetype={profile.archetype} />
            <MatchTypeBadge type={matchType} />
          </div>
        </div>
      </div>

      <CardV2 variant="default" padding="default">
        <CardV2Header className="flex flex-row items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-foreground truncate">{profile.name}</h2>
          <span className="text-2xl shrink-0" aria-hidden>
            {arch?.emoji}
          </span>
        </CardV2Header>

        <CardV2Content className="space-y-4">
          <ArchetypeBadge archetype={profile.archetype} />

          {profile.bio && (
            <p className="text-foreground/90">{profile.bio}</p>
          )}

          {profile.traits && profile.traits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.traits.map((trait, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border border-sage-200 bg-card text-primary-700"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}

          {profile.quote && (
            <div className="flex gap-3">
              <div className="w-1 rounded-full flex-shrink-0 bg-coral-400" />
              <p className="italic text-muted-foreground">&quot;{profile.quote}&quot;</p>
            </div>
          )}

          <ActionButtons
            onPassa={onPass}
            onChatta={onChat}
            onSeProfil={onViewProfile}
            passaLabel="Passa"
            chattaLabel="Chatta"
            seProfilLabel="Se profil"
          />
        </CardV2Content>
      </CardV2>
    </div>
  );
}

export { MatchCardClassic };
