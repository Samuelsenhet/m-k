import * as React from "react";
import { cn } from "@/lib/utils";

/** Match type: Likhets-match or Motsats-match. No percentages (CORE PHILOSOPHY). */
export type MatchTypeV2 = "likhet" | "motsats";

export interface MatchTypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  type: MatchTypeV2;
}

const LABELS: Record<MatchTypeV2, string> = {
  likhet: "Likhets-match",
  motsats: "Motsats-match",
};

const MatchTypeBadge = React.forwardRef<HTMLSpanElement, MatchTypeBadgeProps>(
  ({ className, type, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    >
      {LABELS[type]}
    </span>
  ),
);
MatchTypeBadge.displayName = "MatchTypeBadge";

export { MatchTypeBadge, LABELS };
