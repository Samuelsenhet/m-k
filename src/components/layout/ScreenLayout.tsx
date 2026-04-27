import * as React from "react";
import { cn } from "@/lib/utils";
import { SCREEN_CONTAINER_CLASS } from "@/layout/screenLayout";

export interface ScreenLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content stacked with space-y-6 by default; override with className */
  stackClassName?: string;
}

/**
 * Wraps screen content in the shared container (max-w-2xl, pt-6 pb-24).
 * Use stackClassName to add space-y-6 or space-y-8 for vertical rhythm.
 */
const ScreenLayout = React.forwardRef<HTMLDivElement, ScreenLayoutProps>(
  ({ className, stackClassName, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(SCREEN_CONTAINER_CLASS, className)}
        {...props}
      >
        <div className={cn("space-y-6", stackClassName)}>{children}</div>
      </div>
    );
  }
);
ScreenLayout.displayName = "ScreenLayout";

export { ScreenLayout };
