import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { inputVariants } from "./inputVariants";

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

export { InputV2 };
