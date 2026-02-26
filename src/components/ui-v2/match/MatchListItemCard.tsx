import * as React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelationshipBorder } from "@/lib/relationship-depth";
import { AvatarWithRing } from "../avatar";
import { ArchetypeBadge, type ArchetypeKey } from "../badge/ArchetypeBadge";
import { ButtonCoral } from "../button/ButtonCoral";
import type { RelationshipLevel } from "../card/CardV2";

const RELATIONSHIP_LEVEL_CLASS: Record<RelationshipLevel, string> = {
  1: "relationship-level-1",
  2: "relationship-level-2",
  3: "relationship-level-3",
  4: "relationship-level-4",
  5: "relationship-level-5",
};

export interface MatchListItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  displayName: string;
  archetype: ArchetypeKey;
  /** One-line preview: relational signal (e.g. from personality_insight), not raw info */
  previewText?: string | null;
  avatarSrc?: string | null;
  avatarFallback?: string;
  /** Show "Ny idag" badge */
  isNewToday?: boolean;
  /** FAS Relationship Depth: 1=first contact … 5=real connection */
  relationshipLevel?: RelationshipLevel;
  onChat: () => void;
  onViewProfile?: () => void;
}

/**
 * Match list row for Matches success state (MÄÄK). No scores, no timer, no progress bar.
 * Coral used only for Chatta CTA.
 */
const MatchListItemCard = React.forwardRef<HTMLDivElement, MatchListItemCardProps>(
  (
    {
      className,
      displayName,
      archetype,
      previewText,
      avatarSrc,
      avatarFallback,
      isNewToday = false,
      relationshipLevel,
      onChat,
      onViewProfile,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          relationshipLevel != null && RELATIONSHIP_LEVEL_CLASS[relationshipLevel],
          relationshipLevel != null && getRelationshipBorder(relationshipLevel),
          !relationshipLevel && "border-border bg-card shadow-elevation-1",
          className,
        )}
        {...props}
      >
        <AvatarWithRing
          showRing={false}
          src={avatarSrc}
          fallback={avatarFallback ?? displayName.slice(0, 2).toUpperCase()}
          size="default"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-foreground">{displayName}</span>
            {isNewToday && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                Ny idag
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <ArchetypeBadge archetype={archetype} className="shrink-0" />
          </div>
          {previewText != null && previewText !== "" && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{previewText}</p>
          )}
        </div>
        <ButtonCoral size="sm" className="shrink-0 gap-1.5" onClick={onChat}>
          <MessageCircle className="w-4 h-4" />
          Chatta
        </ButtonCoral>
      </div>
    );
  },
);
MatchListItemCard.displayName = "MatchListItemCard";

export { MatchListItemCard };
