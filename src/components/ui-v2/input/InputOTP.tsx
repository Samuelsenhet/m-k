import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V2 OTP input – token-based styling, keyboard navigation supported by input-otp.
 */
const InputOTPV2 = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    aria-label="Verifieringskod"
    {...props}
  />
));
InputOTPV2.displayName = "InputOTPV2";

const InputOTPV2Group = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  ),
);
InputOTPV2Group.displayName = "InputOTPV2Group";

const InputOTPV2Slot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { index: number }
>(({ index, className, ...props }, ref) => {
  const context = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input bg-background text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        "focus-within:z-10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPV2Slot.displayName = "InputOTPV2Slot";

const InputOTPV2Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Dot className="text-muted-foreground" />
    </div>
  ),
);
InputOTPV2Separator.displayName = "InputOTPV2Separator";

export { InputOTPV2, InputOTPV2Group, InputOTPV2Slot, InputOTPV2Separator };
