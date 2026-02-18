import type { MascotToken } from "@/lib/mascot";
import { getMascotAsset } from "@/lib/mascot";
import { cn } from "@/lib/utils";

/** Size aligns with MaakUnifiedDesignSystem MASCOT_LAYOUT: hero 220px, medium 140px, icon 32px. */
interface MascotProps {
  token: MascotToken;
  size?: "small" | "medium" | "hero" | "icon";
  placement?: "center" | "inline";
  className?: string;
  "aria-hidden"?: boolean;
}

const SIZE_MAP = {
  icon: "w-8 h-8",
  small: "w-12 h-12",
  medium: "w-[140px] h-[140px]",
  hero: "w-[220px] h-[220px]",
} as const;

export function Mascot({
  token,
  size = "medium",
  placement = "center",
  className,
  ...rest
}: MascotProps) {
  const asset = getMascotAsset(token);
  const sizeClass = cn(
    SIZE_MAP[size],
    placement === "center" && "mx-auto",
    "select-none pointer-events-none",
    "flex-shrink-0",
    className,
  );

  if (asset.type === "composite") {
    const { sheet, columns, index } = asset;
    const positionX =
      columns <= 1 ? "0%" : `${(index / (columns - 1)) * 100}%`;
    return (
      <div
        role="img"
        aria-hidden={rest["aria-hidden"] ?? true}
        className={sizeClass}
        style={{
          backgroundImage: `url(/mascot/${sheet})`,
          backgroundSize: `${columns * 100}% 100%`,
          backgroundPosition: `${positionX} 0`,
          backgroundRepeat: "no-repeat",
        }}
      />
    );
  }

  return (
    <img
      src={asset.src}
      alt=""
      aria-hidden={rest["aria-hidden"] ?? true}
      className={sizeClass}
    />
  );
}
