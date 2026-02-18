import * as React from "react";
import { cn } from "@/lib/utils";

export interface OnlineIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  online: boolean;
  size?: "sm" | "default" | "lg";
}

const OnlineIndicator = React.forwardRef<HTMLSpanElement, OnlineIndicatorProps>(
  ({ className, online, size = "default", ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label={online ? "Online" : "Offline"}
      className={cn(
        "inline-block rounded-full border-2 border-background transition-colors duration-normal",
        online ? "bg-primary" : "bg-muted-foreground/40",
        size === "sm" && "h-2 w-2",
        size === "default" && "h-2.5 w-2.5",
        size === "lg" && "h-3 w-3",
        className,
      )}
      {...props}
    />
  ),
);
OnlineIndicator.displayName = "OnlineIndicator";

export { OnlineIndicator };
