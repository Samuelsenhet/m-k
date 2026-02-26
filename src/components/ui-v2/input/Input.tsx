import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-2 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-normal",
  {
    variants: {
      variant: {
        default: "border-transparent focus-visible:ring-[color:var(--input-ring)]",
        filled: "border-border bg-muted focus-visible:ring-[color:var(--input-ring)]",
        outline: "border-2 border-input bg-transparent focus-visible:ring-[color:var(--input-ring)]",
        error: "focus-visible:ring-[color:var(--input-ring-error)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputV2Props
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const InputV2 = React.forwardRef<HTMLInputElement, InputV2Props>(
  ({ className, variant = "default", type, style, ...props }, ref) => {
    const isError = variant === "error";
    const baseStyle: React.CSSProperties = {
      ["--input-ring" as string]: COLORS.primary[400],
      ["--input-ring-error" as string]: COLORS.coral[500],
      backgroundColor: variant === "default" ? COLORS.neutral.cream : undefined,
      borderColor: isError ? COLORS.coral[500] : variant === "default" ? "transparent" : undefined,
      color: isError ? COLORS.coral[600] : undefined,
      ...style,
    };
    return (
      <input
        type={type}
        ref={ref}
        className={cn(inputVariants({ variant, className }))}
        style={baseStyle}
        {...props}
      />
    );
  },
);
InputV2.displayName = "InputV2";

/* eslint-disable react-refresh/only-export-components -- inputVariants shared with consumers */
export { InputV2, inputVariants };
