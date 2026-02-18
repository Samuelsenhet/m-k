import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export type ButtonIconVariant = "ghost" | "primary" | "coral" | "outline" | "glass";

export interface ButtonIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: ButtonIconVariant;
}

const variantStyles: Record<ButtonIconVariant, string> = {
  ghost: "hover:bg-accent hover:text-accent-foreground",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-1",
  coral: "bg-coral text-white hover:bg-coral-600 shadow-elevation-1",
  outline: "border border-border hover:bg-accent hover:text-accent-foreground",
  glass: "bg-white/60 backdrop-blur-md border border-white/30 hover:bg-white/80 shadow-elevation-1",
};

const sizeStyles: Record<NonNullable<ButtonIconProps["size"]>, string> = {
  sm: "h-9 w-9 [&_svg]:size-4",
  md: "h-10 w-10 [&_svg]:size-5",
  lg: "h-12 w-12 [&_svg]:size-6",
};

const ButtonIcon = React.forwardRef<HTMLButtonElement, ButtonIconProps>(
  ({ className, asChild = false, size = "md", variant = "ghost", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        aria-label={props["aria-label"] ?? "Knapp"}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonIcon.displayName = "ButtonIcon";

export { ButtonIcon };
