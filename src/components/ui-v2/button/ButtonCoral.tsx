import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonCoralProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "default" | "sm" | "lg";
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

const ButtonCoral = React.forwardRef<HTMLButtonElement, ButtonCoralProps>(
  (
    { className, asChild = false, size = "default", icon: Icon, fullWidth, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const sizes = {
      sm: "h-10 px-4 text-sm gap-1.5 rounded-2xl",
      default: "h-12 px-6 text-base gap-2 rounded-2xl",
      lg: "h-14 px-8 text-lg gap-2.5 rounded-2xl",
    };
    return (
      <Comp
        ref={ref}
        className={cn(
          "font-semibold inline-flex items-center justify-center transition-all duration-200 text-white",
          "hover:scale-[1.02] active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "shadow-[var(--shadow-coral-button)]",
          sizes[size],
          fullWidth && "w-full",
          "[&_svg]:shrink-0 [&_svg]:size-5",
          className,
        )}
        style={
          Comp === "button"
            ? { background: "var(--gradient-coral-button)" }
            : undefined
        }
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
ButtonCoral.displayName = "ButtonCoral";

export { ButtonCoral };
