import type { MascotToken } from "@/lib/mascot";
import { cn } from "@/lib/utils";

/** Size aligns with Mascot.tsx SIZE_MAP. */
const SIZE_MAP = {
  icon: "w-8 h-8",
  small: "w-12 h-12",
  medium: "w-[140px] h-[140px]",
  hero: "w-[220px] h-[220px]",
} as const;

type MascotSize = keyof typeof SIZE_MAP;

export interface MascotSvgFallbackProps {
  token: MascotToken;
  size?: MascotSize;
  placement?: "center" | "inline" | "corner";
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Neutral MÄÄK placeholder when PNG assets are missing or fail to load.
 * No old mascot design – single source of truth for visuals is Figma (public/mascot/*.png).
 */
export function MascotSvgFallback({
  size = "medium",
  placement = "center",
  className,
  ...rest
}: MascotSvgFallbackProps) {
  const sizeClass = cn(
    SIZE_MAP[size],
    placement === "center" && "mx-auto",
    "select-none pointer-events-none flex-shrink-0",
    className,
  );

  const isIcon = size === "icon";
  const isSmall = size === "small";

  return (
    <div
      role="img"
      aria-label="MÄÄK"
      className={cn(
        "relative flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20",
        sizeClass,
      )}
      {...rest}
    >
      <span
        className={cn(
          "font-heading font-bold text-primary",
          isIcon && "text-sm",
          isSmall && "text-base",
          (size === "medium" || size === "hero") && "text-2xl",
        )}
      >
        {isIcon ? "M" : "MÄÄK"}
      </span>
    </div>
  );
}
