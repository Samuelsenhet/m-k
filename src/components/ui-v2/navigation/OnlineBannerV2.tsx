import * as React from "react";
import { cn } from "@/lib/utils";

export interface OnlineBannerV2Props {
  count: number;
  label: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * FAS 5 – OnlineBanner V2. Token-based bar; count uses motion tokens for calm updates.
 */
export function OnlineBannerV2({
  count,
  label,
  className,
  "aria-label": ariaLabel,
}: OnlineBannerV2Props) {
  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-2 px-3",
          "bg-primary text-primary-foreground shadow-elevation-1 safe-area-top",
          "transition-opacity duration-normal",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel ?? label}
      >
        <p className="text-sm font-semibold text-center tabular-nums">
          {label}
        </p>
      </div>
      <div className="h-10 flex-shrink-0" aria-hidden="true" />
    </>
  );
}
