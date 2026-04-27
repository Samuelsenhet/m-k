import * as React from "react";
import { cn } from "@/lib/utils";

/** Chat status: Start Chat (solid coral), Your Turn (outline coral). Design goal – no like/percent. */
export type ChatStatusV2 = "start-chat" | "your-turn";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ChatStatusV2;
  /** Optional override text */
  children?: React.ReactNode;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, children, ...props }, ref) => {
    const label = children ?? (status === "start-chat" ? "Start Chat" : "Your Turn");
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          status === "start-chat" && "bg-coral text-white",
          status === "your-turn" && "border border-coral text-coral bg-transparent",
          className,
        )}
        {...props}
      >
        {label}
      </span>
    );
  },
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
