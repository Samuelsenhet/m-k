import * as React from "react";
import { cn } from "@/lib/utils";
import { AvatarV2, AvatarV2Image, AvatarV2Fallback } from "./AvatarV2";

export interface AvatarWithRingProps
  extends React.ComponentPropsWithoutRef<typeof AvatarV2> {
  /** Show coral ring (e.g. unread / active in chat) */
  showRing?: boolean;
  /** Ring variant: coral = design accent, primary = trust */
  ringVariant?: "coral" | "primary";
  /** Show online indicator dot */
  online?: boolean;
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
}

const AvatarWithRing = React.forwardRef<
  React.ElementRef<typeof AvatarV2>,
  AvatarWithRingProps
>(
  (
    {
      className,
      showRing = false,
      ringVariant = "coral",
      online,
      src,
      alt,
      fallback,
      size = "default",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative inline-block shrink-0">
        <AvatarV2
          ref={ref}
          size={size}
          className={cn(
            "ring-2 ring-background",
            showRing && ringVariant === "coral" && "ring-coral",
            showRing && ringVariant === "primary" && "ring-primary",
            className,
          )}
          {...props}
        >
          {src != null && <AvatarV2Image src={src} alt={alt ?? ""} />}
          <AvatarV2Fallback>{fallback}</AvatarV2Fallback>
        </AvatarV2>
        {online !== undefined && (
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
              online ? "bg-primary" : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
        )}
      </div>
    );
  },
);
AvatarWithRing.displayName = "AvatarWithRing";

export { AvatarWithRing };
