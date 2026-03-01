import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

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

/** Slot props from input-otp render callback; when provided, context is not used. */
export interface InputOTPV2SlotProps extends React.HTMLAttributes<HTMLDivElement> {
  index?: number;
  char?: string | null;
  hasFakeCaret?: boolean;
  isActive?: boolean;
  placeholderChar?: string | null;
}

const InputOTPV2Slot = React.forwardRef<HTMLDivElement, InputOTPV2SlotProps>(
  ({ index, char: charProp, hasFakeCaret: hasFakeCaretProp, isActive: isActiveProp, placeholderChar, className, style: slotStyle, ...rest }, ref) => {
    const context = React.useContext(OTPInputContext);
    const fromContext =
      context?.slots && typeof index === "number" ? context.slots[index] : undefined;
    const char = charProp ?? fromContext?.char ?? null;
    const hasFakeCaret = hasFakeCaretProp ?? fromContext?.hasFakeCaret ?? false;
    const isActive = isActiveProp ?? fromContext?.isActive ?? false;
    const display = char ?? placeholderChar ?? "";

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-12 h-14 items-center justify-center border-y border-r border-input bg-background text-sm text-center transition-all first:rounded-l-md first:border-l last:rounded-r-md",
          "focus-within:z-10 focus-within:ring-2 focus-within:ring-[color:var(--otp-ring)] focus-within:ring-offset-2",
          isActive && "z-10 ring-2 ring-[color:var(--otp-ring)] ring-offset-2",
          className,
        )}
        style={{
          ["--otp-ring" as string]: COLORS.primary[400],
          borderColor: COLORS.sage[200],
          ...(slotStyle as React.CSSProperties),
        }}
        {...rest}
      >
        {display}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
          </div>
        )}
      </div>
    );
  },
);
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
