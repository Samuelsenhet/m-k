import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchetypeKey } from "../badge/ArchetypeBadge";
import { ARCHETYPES } from "../badge/ArchetypeBadge";

export interface MatchListItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  archetype: ArchetypeKey;
  /** Optional emoji override; defaults to archetype emoji. */
  emoji?: string;
}

/**
 * Single row for match list (Dagens matchningar). Design: white card, emoji box, name, archetype label, chevron.
 */
const MatchListItem = React.forwardRef<HTMLButtonElement, MatchListItemProps>(
  ({ name, archetype, emoji, className, ...props }, ref) => {
    const arch = ARCHETYPES[archetype];
    const displayEmoji = emoji ?? arch?.emoji ?? "👤";

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] text-left",
          "bg-card shadow-elevation-1",
          className,
        )}
        {...props}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-sage-100">
          {displayEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">{name}</h3>
          {arch && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span aria-hidden>{arch.emoji}</span>
              <span className="text-sm text-muted-foreground">{arch.label}</span>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
      </button>
    );
  },
);
MatchListItem.displayName = "MatchListItem";

export { MatchListItem };
