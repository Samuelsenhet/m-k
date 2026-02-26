import { useState } from "react";
import type {
  MascotToken,
  MascotAnimationType,
  MascotPlacement,
  MascotSpacingPreset,
} from "@/lib/mascot";
import { getMascotAsset } from "@/lib/mascot";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MascotSvgFallback } from "@/components/system/MascotSvgFallback";

/** Size aligns with MaakUnifiedDesignSystem MASCOT_LAYOUT: hero 220px, medium 140px, icon 32px. */
interface MascotProps {
  token: MascotToken;
  size?: "small" | "medium" | "hero" | "icon";
  placement?: MascotPlacement;
  animation?: MascotAnimationType;
  /** From useMascot (M11 placement intelligence); defaults from placement. */
  spacingPreset?: MascotSpacingPreset;
  className?: string;
  "aria-hidden"?: boolean;
  /** FAS Presence: from useMascot; used by parent to conditionally render. Not passed to DOM. */
  shouldShow?: boolean;
  /** From useMascot; not used by Mascot directly. Destructured here to prevent DOM prop warning. */
  mascotGoal?: string;
}

/** M11: Layout role classes – no per-screen margin utilities. */
const PLACEMENT_CLASS_MAP: Record<MascotPlacement, string> = {
  center: "block mx-auto",
  inline: "mascot-inline-wrap inline-flex items-center self-center",
  corner: "mascot-corner-safe mascot-corner-fade",
};

/** M11: Spacing from resolver; merged into final class list. */
const SPACING_CLASS_MAP: Record<MascotSpacingPreset, string> = {
  "stack-gap": "mb-6 mt-2",
  "inline-tight": "ml-2",
  "floating-safe": "",
};

/**
 * Animation variants for state-based mascot movement.
 * - idle-breathe: 2% scale pulse, 4s duration — barely noticeable, calm presence
 * - gentle-float: 6px vertical float, 3s duration — noticeable but soothing
 * - celebrate-bounce: 8% scale + slight rotate, plays twice on mount
 * - none: no animation
 */
const ANIMATION_VARIANTS = {
  "idle-breathe": {
    scale: [1, 1.02, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
  "gentle-float": {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  "celebrate-bounce": {
    scale: [1, 1.08, 1],
    rotate: [0, 2, -2, 0],
    transition: { duration: 0.6, repeat: 2, ease: "easeOut" },
  },
  none: {},
} as const;

const SIZE_MAP = {
  icon: "w-8 h-8",
  small: "w-12 h-12",
  medium: "w-[140px] h-[140px]",
  hero: "w-[220px] h-[220px]",
} as const;

/** Solid background so transparent PNG areas never show through. Uses theme background with fallback. */
const MASCOT_BG_STYLE = {
  backgroundColor: "hsl(var(--background, 30 10% 94%))",
} as const;

function getSpacingPreset(placement: MascotPlacement, preset?: MascotSpacingPreset): MascotSpacingPreset {
  if (preset) return preset;
  if (placement === "corner") return "floating-safe";
  if (placement === "inline") return "inline-tight";
  return "stack-gap";
}

export function Mascot({
  token,
  size = "medium",
  placement = "center",
  animation = "none",
  spacingPreset: spacingPresetProp,
  className,
  shouldShow: _shouldShow,
  mascotGoal: _mascotGoal,
  ...rest
}: MascotProps) {
  const [useSvgFallback, setUseSvgFallback] = useState(false);
  const asset = getMascotAsset(token);
  const spacingPreset = getSpacingPreset(placement, spacingPresetProp);
  const placementClass = PLACEMENT_CLASS_MAP[placement];
  const spacingClass = SPACING_CLASS_MAP[spacingPreset];
  const wrapperClass = cn(
    placementClass,
    spacingClass,
    "select-none pointer-events-none flex-shrink-0",
    className,
  );
  const sizeClass = cn(
    SIZE_MAP[size],
    "aspect-square",
  );

  const animationVariant = ANIMATION_VARIANTS[animation] ?? ANIMATION_VARIANTS.none;

  if (useSvgFallback) {
    return (
      <motion.div
        className={cn(wrapperClass, sizeClass)}
        style={MASCOT_BG_STYLE}
        animate={animationVariant}
      >
        <MascotSvgFallback token={token} size={size} placement={placement} {...rest} />
      </motion.div>
    );
  }

  if (asset.type === "composite") {
    const { sheet, columns, index } = asset;
    const positionX =
      columns <= 1 ? "0%" : `${(index / (columns - 1)) * 100}%`;
    return (
      <motion.div
        role="img"
        aria-hidden={rest["aria-hidden"] ?? true}
        className={cn(wrapperClass, sizeClass)}
        animate={animationVariant}
        style={{
          ...MASCOT_BG_STYLE,
          backgroundImage: `url(/mascot/${sheet})`,
          backgroundSize: `${columns * 100}% 100%`,
          backgroundPosition: `${positionX} 0`,
          backgroundRepeat: "no-repeat",
        }}
      >
        <img
          src={`/mascot/${sheet}`}
          alt=""
          className="sr-only object-contain bg-transparent"
          onError={() => setUseSvgFallback(true)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(wrapperClass, sizeClass, "bg-transparent")}
      style={{ backgroundColor: "transparent" }}
      animate={animationVariant}
    >
      <img
        src={asset.src}
        alt=""
        aria-hidden={rest["aria-hidden"] ?? true}
        className="block w-full h-full object-contain bg-transparent"
        onError={() => setUseSvgFallback(true)}
      />
    </motion.div>
  );
}
