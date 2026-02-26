import * as React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

export interface ProgressStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 1-based current step (e.g. 2 = second step active). */
  current: number;
  /** Total number of steps. */
  total: number;
}

/**
 * Progress Steps – onboarding/stepper indicator.
 * Design: completed = primary gradient, current = primary-200, upcoming = sage-200 (from tokens).
 */
const ProgressSteps = React.forwardRef<HTMLDivElement, ProgressStepsProps>(
  ({ current, total, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {Array.from({ length: total }).map((_, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isCurrent = step === current;
          return (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: isCompleted
                  ? `linear-gradient(90deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
                  : isCurrent
                    ? COLORS.primary[200]
                    : COLORS.sage[200],
              }}
            />
          );
        })}
      </div>
    );
  },
);
ProgressSteps.displayName = "ProgressSteps";

export { ProgressSteps };
