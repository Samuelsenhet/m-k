import * as React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

export interface OnlineBannerV2Props {
  count: number;
  label: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * OnlineBanner V2 – primary-500 bakgrund, neutral.white text, py-2.5 px-4, text-center, text-sm font-medium.
 */
export function OnlineBannerV2({
  label,
  className,
  "aria-label": ariaLabel,
}: OnlineBannerV2Props) {
  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-2.5 px-4 safe-area-top",
          "shadow-elevation-1 transition-opacity duration-normal",
          className,
        )}
        style={{
          background: COLORS.primary[500],
          color: COLORS.neutral.white,
        }}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel ?? label}
      >
        <p className="text-sm font-medium text-center tabular-nums">
          {label}
        </p>
      </div>
      <div className="h-10 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
