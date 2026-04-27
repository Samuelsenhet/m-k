import * as React from "react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/system/Mascot";
import { COLORS } from "@/design/tokens";
import type { MascotToken } from "@/lib/mascot";

export interface AIChatBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  token?: MascotToken;
  message: React.ReactNode;
}

const DEFAULT_AI_TOKEN: MascotToken = "mascot_ai_open_hand";

function AIChatBubble(
  { token = DEFAULT_AI_TOKEN, message, className, ...props }: AIChatBubbleProps,
  ref: React.Ref<HTMLDivElement>,
) {
  return (
    <div ref={ref} className={cn("flex gap-3 items-start", className)} {...props}>
      <div className="flex-shrink-0">
        <Mascot token={token} size="small" placement="inline" />
      </div>
      <div
        className="flex-1 p-4 rounded-2xl rounded-tl-md"
        style={{ background: COLORS.sage[100] }}
      >
        <div className="text-sm text-foreground">{message}</div>
      </div>
    </div>
  );
}

const AIChatBubbleWithRef = React.forwardRef(AIChatBubble);
AIChatBubbleWithRef.displayName = "AIChatBubble";

export { AIChatBubbleWithRef as AIChatBubble };
