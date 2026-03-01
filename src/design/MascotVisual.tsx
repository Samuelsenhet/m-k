import * as React from "react";
import { cn } from "@/lib/utils";
import { COLORS, type MascotStateKey } from "./tokens";
import { getMascotTokenForDesignState, DARK_BG_STATES } from "./mascotVisualHelpers";

const SIZE_CLASSES = {
  icon: "w-10 h-10",
  small: "w-20 h-20",
  medium: "w-32 h-32",
  large: "w-44 h-44",
  hero: "w-56 h-56",
} as const;

export interface MascotVisualProps {
  /** Design system state key (maps to token and optional dark bg) */
  state?: MascotStateKey;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  /** Optional message below mascot (e.g. empty state copy) */
  message?: string;
}

/**
 * Mascot visual with design system styling: rounded container,
 * sage-50 or dark background, and /mascot/{token}.png image.
 */
export function MascotVisual({
  state = "calm",
  size = "medium",
  className,
  message,
}: MascotVisualProps) {
  const token = getMascotTokenForDesignState(state);
  const isDark = DARK_BG_STATES.has(String(state));
  const bg = isDark ? COLORS.neutral.dark : COLORS.sage[50];

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl flex-shrink-0 flex items-center justify-center",
          SIZE_CLASSES[size],
        )}
        style={{ background: bg }}
      >
        <img
          src={`/mascot/${token}.png`}
          alt=""
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      {message && (
        <p
          className="text-center text-sm max-w-[200px] italic animate-fade-in"
          style={{ color: COLORS.neutral.slate }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
