import * as React from "react";
import { InputV2, type InputV2Props } from "./Input";
import { cn } from "@/lib/utils";

export interface InputSearchV2Props extends Omit<InputV2Props, "type"> {
  type?: "search" | "text";
  leftIcon?: React.ReactNode;
}

/**
 * Search-style input: rounded-full, pl-12 for left icon. Design system US-015.
 */
const InputSearchV2 = React.forwardRef<HTMLInputElement, InputSearchV2Props>(
  ({ className, leftIcon, type = "search", ...props }, ref) => (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        <div className="absolute left-4 pointer-events-none flex items-center justify-center text-muted-foreground">
          {leftIcon}
        </div>
      )}
      <InputV2
        ref={ref}
        type={type}
        className={cn("rounded-full pl-12", className)}
        aria-label={props["aria-label"] ?? "Sök"}
        {...props}
      />
    </div>
  ),
);
InputSearchV2.displayName = "InputSearchV2";

export { InputSearchV2 };
