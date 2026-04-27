import * as React from "react";
import { cn } from "@/lib/utils";

const ARCHETYPES = {
  diplomat: { label: "Diplomaten", emoji: "🕊️", class: "bg-personality-diplomat/15 text-personality-diplomat border-personality-diplomat/30" },
  strateger: { label: "Strategen", emoji: "🎯", class: "bg-personality-strateger/15 text-personality-strateger border-personality-strateger/30" },
  byggare: { label: "Byggaren", emoji: "🏗️", class: "bg-personality-byggare/15 text-personality-byggare border-personality-byggare/30" },
  upptackare: { label: "Upptäckaren", emoji: "🧭", class: "bg-personality-upptackare/15 text-personality-upptackare border-personality-upptackare/30" },
} as const;

export type ArchetypeKey = keyof typeof ARCHETYPES;

export interface ArchetypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  archetype: ArchetypeKey;
  showEmoji?: boolean;
}

const ArchetypeBadge = React.forwardRef<HTMLSpanElement, ArchetypeBadgeProps>(
  ({ className, archetype, showEmoji = true, ...props }, ref) => {
    const config = ARCHETYPES[archetype];
    if (!config) return null;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          config.class,
          className,
        )}
        {...props}
      >
        {showEmoji && <span aria-hidden>{config.emoji}</span>}
        {config.label}
      </span>
    );
  },
);
ArchetypeBadge.displayName = "ArchetypeBadge";

export { ArchetypeBadge, ARCHETYPES };
