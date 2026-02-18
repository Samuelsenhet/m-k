import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* MÄÄK design system: white card, rounded-2xl, soft shadow */
const cardV2Variants = cva(
  "rounded-2xl transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground shadow-elevation-1",
        interactive:
          "bg-card text-card-foreground shadow-elevation-1 hover:shadow-elevation-2 cursor-pointer",
        premium:
          "bg-card text-card-foreground shadow-elevation-2",
        glass:
          "bg-white/80 backdrop-blur-md border border-sage-200/50 shadow-elevation-1",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  },
);

export interface CardV2Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardV2Variants> {}

const CardV2 = React.forwardRef<HTMLDivElement, CardV2Props>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardV2Variants({ variant, padding, className }))}
      {...props}
    />
  ),
);
CardV2.displayName = "CardV2";

const CardV2Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
  ),
);
CardV2Header.displayName = "CardV2Header";

const CardV2Title = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardV2Title.displayName = "CardV2Title";

const CardV2Content = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
CardV2Content.displayName = "CardV2Content";

const CardV2Footer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  ),
);
CardV2Footer.displayName = "CardV2Footer";

export { CardV2, CardV2Header, CardV2Title, CardV2Content, CardV2Footer, cardV2Variants };
