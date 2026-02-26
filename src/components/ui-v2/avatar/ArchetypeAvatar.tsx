import * as React from "react";
import { cn } from "@/lib/utils";
import { ARCHETYPES, type ArchetypeKey } from "../badge/ArchetypeBadge";

/** HSL variable names for ring gradient (same as CSS --diplomat, etc.). */
const ARCHETYPE_CSS_VARS: Record<ArchetypeKey, string> = {
  diplomat: "var(--diplomat)",
  strateger: "var(--strateger)",
  byggare: "var(--byggare)",
  upptackare: "var(--upptackare)",
};

const SIZE_MAP = {
  sm: 32,
  default: 56,
  lg: 72,
} as const;

export interface ArchetypeAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  archetype: ArchetypeKey;
  src?: string | null;
  name?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * Avatar with personality-colored ring (design system: Archetype Avatar).
 * Fallback: emoji or first letter of name.
 */
const ArchetypeAvatar = React.forwardRef<HTMLDivElement, ArchetypeAvatarProps>(
  ({ archetype, src, name, size = "default", className, ...props }, ref) => {
    const arch = ARCHETYPES[archetype];
    const px = SIZE_MAP[size];
    const cssVar = ARCHETYPE_CSS_VARS[archetype];

    if (!arch) return null;

    return (
      <div
        ref={ref}
        className={cn("relative inline-block shrink-0", className)}
        {...props}
      >
        <div
          className="rounded-full p-[3px]"
          style={{
            background: `linear-gradient(135deg, hsl(${cssVar}) 0%, hsl(${cssVar} / 0.9) 100%)`,
          }}
        >
          <div
            className={cn(
              "rounded-full overflow-hidden border-[3px] border-background flex items-center justify-center font-semibold shadow-md",
              !src && "bg-personality-diplomat/15 text-personality-diplomat",
              !src && archetype === "strateger" && "bg-personality-strateger/15 text-personality-strateger",
              !src && archetype === "byggare" && "bg-personality-byggare/15 text-personality-byggare",
              !src && archetype === "upptackare" && "bg-personality-upptackare/15 text-personality-upptackare",
              src && "bg-muted text-foreground",
            )}
            style={{
              width: px,
              height: px,
              fontSize: px * 0.4,
            }}
          >
            {src ? (
              <img src={src} alt={name ?? ""} className="w-full h-full object-contain bg-transparent" />
            ) : (
              arch.emoji ?? name?.[0]?.toUpperCase() ?? "?"
            )}
          </div>
        </div>
      </div>
    );
  },
);
ArchetypeAvatar.displayName = "ArchetypeAvatar";

export { ArchetypeAvatar };
