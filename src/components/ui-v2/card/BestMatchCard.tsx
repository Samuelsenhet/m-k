import * as React from "react";
import { cn } from "@/lib/utils";
import { ArchetypeBadge, MatchTypeBadge, type ArchetypeKey } from "../badge";
import { InterestChipV2 } from "./InterestChipV2";

export interface BestMatchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  imageSrc?: string | null;
  imageAlt?: string;
  interests?: string[];
  archetype?: ArchetypeKey;
  /** "similar" → Likhet, "complementary" → Motsats (text-only badge) */
  matchType?: "similar" | "complementary";
}

const ASPECT_RATIO = "3/4";

const BestMatchCard = React.forwardRef<HTMLDivElement, BestMatchCardProps>(
  (
    {
      className,
      name,
      imageSrc,
      imageAlt,
      interests = [],
      archetype,
      matchType,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1 transition-shadow duration-normal hover:shadow-elevation-2",
          className,
        )}
        {...props}
      >
        <div className="relative" style={{ aspectRatio: ASPECT_RATIO }}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt ?? name}
              className="h-full w-full object-contain bg-transparent"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <span className="text-4xl" aria-hidden>👤</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="truncate font-semibold text-white">{name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          {interests.slice(0, 3).map((label) => (
            <InterestChipV2 key={label} label={label} />
          ))}
          {archetype != null && <ArchetypeBadge archetype={archetype} className="shrink-0" />}
          {matchType != null && (
            <MatchTypeBadge
              type={matchType === "similar" ? "likhet" : "motsats"}
              className="shrink-0"
            />
          )}
        </div>
      </div>
    );
  },
);
BestMatchCard.displayName = "BestMatchCard";

export { BestMatchCard };
