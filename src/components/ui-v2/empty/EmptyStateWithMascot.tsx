import * as React from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import type { EmotionalConfig } from "@/lib/emotional-state";
import { ButtonPrimary } from "../button/ButtonPrimary";

export interface EmptyStateWithMascotAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateWithMascotProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Screen state for mascot (e.g. empty_matches, no_chats, first_match). */
  screenState: string;
  title: string;
  description: string;
  action?: EmptyStateWithMascotAction;
  /** When provided, mascot goal from emotion; mascot only renders when emotion !== "neutral". */
  emotionalConfig?: EmotionalConfig;
}

/**
 * Empty state with mascot, title, description and optional CTA. Design: centered, large mascot, primary button.
 * FAS Orchestration: when emotionalConfig provided, mascot only shows when emotionalState !== "neutral".
 */
const EmptyStateWithMascot = React.forwardRef<HTMLDivElement, EmptyStateWithMascotProps>(
  ({ screenState, title, description, action, emotionalConfig, className, ...props }, ref) => {
    const mascot = useMascot(screenState, emotionalConfig ? { emotionalConfig } : undefined);

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
        <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">{title}</h3>
        <p className="text-sm mb-6 max-w-[250px] text-muted-foreground">{description}</p>
        {action && (
          <ButtonPrimary onClick={action.onClick}>{action.label}</ButtonPrimary>
        )}
      </div>
    );
  },
);
EmptyStateWithMascot.displayName = "EmptyStateWithMascot";

export { EmptyStateWithMascot };
