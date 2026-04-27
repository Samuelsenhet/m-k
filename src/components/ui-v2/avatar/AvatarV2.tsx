import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const AvatarV2 = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      size === "sm" && "h-8 w-8",
      size === "default" && "h-10 w-10",
      size === "lg" && "h-12 w-12",
      className,
    )}
    {...props}
  />
));
AvatarV2.displayName = "AvatarV2";

const AvatarV2Image = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-contain bg-transparent", className)}
    {...props}
  />
));
AvatarV2Image.displayName = "AvatarV2Image";

const AvatarV2Fallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium",
      className,
    )}
    {...props}
  />
));
AvatarV2Fallback.displayName = "AvatarV2Fallback";

export { AvatarV2, AvatarV2Image, AvatarV2Fallback };
