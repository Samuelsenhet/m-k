import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getRelationshipBorder } from "@/lib/relationship-depth";

/* MÄÄK design system: white card, rounded-3xl, soft shadow (MaakPolished).
 * FAS Relationship Depth: relationshipLevel 1–5 maps to surface/border/elevation (no premium/glow). */
const cardV2Variants = cva(
  "rounded-3xl border transition-all duration-200 text-card-foreground",
  {
    variants: {
      variant: {
        default:
          "bg-card shadow-elevation-1 border-border",
        interactive:
          "bg-card shadow-elevation-1 border-border hover:shadow-elevation-2 cursor-pointer",
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

export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

const RELATIONSHIP_LEVEL_CLASS: Record<RelationshipLevel, string> = {
  1: "relationship-level-1",
  2: "relationship-level-2",
  3: "relationship-level-3",
  4: "relationship-level-4",
  5: "relationship-level-5",
};

export interface CardV2Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardV2Variants> {
  /** FAS Relationship Depth: visual depth 1=first contact … 5=real connection. Overrides variant surface when set. */
  relationshipLevel?: RelationshipLevel;
}

const CardV2 = React.forwardRef<HTMLDivElement, CardV2Props>(
  ({ className, variant, padding, relationshipLevel, ...props }, ref) => {
    const borderClass =
      relationshipLevel !== undefined && relationshipLevel !== null
        ? getRelationshipBorder(relationshipLevel)
        : "";
    return (
      <div
        ref={ref}
        className={cn(
          cardV2Variants({ variant, padding }),
          relationshipLevel != null && RELATIONSHIP_LEVEL_CLASS[relationshipLevel],
          borderClass,
          className,
        )}
        {...props}
      />
    );
  },
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

/* eslint-disable react-refresh/only-export-components -- cardV2Variants shared with consumers */
export { CardV2, CardV2Header, CardV2Title, CardV2Content, CardV2Footer, cardV2Variants };
