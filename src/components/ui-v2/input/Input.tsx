import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors duration-normal",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background focus-visible:ring-ring",
        filled:
          "border-border bg-muted focus-visible:ring-ring focus-visible:border-primary/30",
        outline:
          "border-2 border-input bg-transparent focus-visible:ring-ring focus-visible:border-primary/50",
        error:
          "border-destructive bg-background focus-visible:ring-destructive",
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
  ({ className, variant, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  ),
);
InputV2.displayName = "InputV2";

export { InputV2, inputVariants };
