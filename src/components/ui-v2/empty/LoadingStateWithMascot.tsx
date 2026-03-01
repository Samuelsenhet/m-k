import * as React from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import type { EmotionalConfig } from "@/lib/emotional-state";

const DEFAULT_LOADING_MESSAGE = "Jag är här medan vi väntar. Bra saker får ta tid.";

export interface LoadingStateWithMascotProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional custom message. Default: design system loading copy. */
  message?: string;
  /** When provided, mascot goal from emotion; mascot only renders when emotion !== "neutral". */
  emotionalConfig?: EmotionalConfig;
}

/**
 * Loading state with mascot (token: loading / mascot_waiting_tea). Large mascot, reassuring copy.
 * FAS Orchestration: when emotionalConfig provided, mascot only shows when emotionalState !== "neutral".
 */
const LoadingStateWithMascot = React.forwardRef<HTMLDivElement, LoadingStateWithMascotProps>(
  ({ message = DEFAULT_LOADING_MESSAGE, emotionalConfig, className, ...props }, ref) => {
    const mascot = useMascot(MASCOT_SCREEN_STATES.LOADING, emotionalConfig ? { emotionalConfig } : undefined);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6 text-center",
          className,
        )}
        {...props}
      >
        {mascot.shouldShow && <Mascot {...mascot} />}
        <p className="text-sm mt-6 max-w-[280px] text-muted-foreground">{message}</p>
      </div>
    );
  },
);
LoadingStateWithMascot.displayName = "LoadingStateWithMascot";

export { LoadingStateWithMascot };
