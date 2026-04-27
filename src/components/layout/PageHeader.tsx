import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Shared header pattern for all screens. No extra margin – parent controls spacing (space-y-6/8).
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, subtitle, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between gap-4", className)}
        {...props}
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-foreground font-heading truncate">
            {title}
          </h1>
          {subtitle != null && (
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}
        </div>
        {actions != null && (
          <div className="shrink-0 flex items-center gap-1">{actions}</div>
        )}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader };
