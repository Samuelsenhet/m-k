import * as React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

export interface InterestChipV2Props extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  icon?: React.ReactNode;
  /** default: light chip (Profile, lists). dark: overlay/sheet on dark bg */
  variant?: "default" | "dark";
  /** For selectable chips (e.g. Onboarding): selected state uses primary-100/400/700 */
  selected?: boolean;
}

const InterestChipV2 = React.forwardRef<HTMLSpanElement, InterestChipV2Props>(
  ({ className, label, icon, variant = "default", selected = false, style, ...props }, ref) => {
    const isDark = variant === "dark";
    const baseStyle: React.CSSProperties = isDark
      ? { borderColor: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.2)", color: COLORS.neutral.white }
      : selected
        ? {
            backgroundColor: COLORS.primary[100],
            borderColor: COLORS.primary[400],
            color: COLORS.primary[700],
          }
        : {
            backgroundColor: COLORS.neutral.white,
            borderColor: COLORS.sage[200],
            color: COLORS.neutral.charcoal,
          };
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-transform",
          "hover:scale-[1.02] active:scale-[0.98]",
          className,
        )}
        style={{ ...baseStyle, ...style }}
        {...props}
      >
        {icon != null && <span className="shrink-0 [&_svg]:size-3.5" aria-hidden>{icon}</span>}
        {label}
      </span>
    );
  },
);
InterestChipV2.displayName = "InterestChipV2";

export { InterestChipV2 };
