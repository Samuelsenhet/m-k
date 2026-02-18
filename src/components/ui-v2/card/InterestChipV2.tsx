import * as React from "react";
import { cn } from "@/lib/utils";

export interface InterestChipV2Props extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "dark";
}

const InterestChipV2 = React.forwardRef<HTMLSpanElement, InterestChipV2Props>(
  ({ className, label, icon, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "border-border bg-muted/80 text-foreground",
        variant === "dark" && "border-white/20 bg-white/10 text-white",
        className,
      )}
      {...props}
    >
      {icon != null && <span className="shrink-0 [&_svg]:size-3.5" aria-hidden>{icon}</span>}
      {label}
    </span>
  ),
);
InterestChipV2.displayName = "InterestChipV2";

export { InterestChipV2 };
