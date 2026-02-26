import * as React from "react";
import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { COLORS } from "@/design/tokens";

export interface ChatBubbleV2Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

export type ChatBubbleV2Variant = "own" | "them" | "system";

export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

export interface ChatBubbleV2Props {
  message: ChatBubbleV2Message;
  variant: ChatBubbleV2Variant;
  isOwn: boolean;
  /** FAS Conversation Depth: drives bubble radius, surface, read state (no color change) */
  relationshipLevel?: RelationshipLevel | null;
}

const ChatBubbleV2 = React.memo(function ChatBubbleV2({
  message,
  variant,
  isOwn,
  relationshipLevel,
}: ChatBubbleV2Props) {
  if (variant === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center mb-2"
        role="listitem"
      >
        <div className="max-w-[85%] px-3 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-xs">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const depth3 = relationshipLevel != null && relationshipLevel >= 3;
  const depth4Or5 = relationshipLevel != null && relationshipLevel >= 4;
  const readAsText = depth3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn("flex mb-2", isOwn ? "justify-end" : "justify-start")}
      role="listitem"
    >
      <div
        className={cn(
          "max-w-[80%] px-3 py-2 text-sm transition-colors duration-normal",
          depth4Or5 && isOwn && "shadow-sm",
          depth4Or5 && !isOwn && "border border-border/60",
          depth3 && isOwn && "rounded-[1.25rem] rounded-br-sm shadow-elevation-1",
          depth3 && !isOwn && "rounded-2xl rounded-bl-sm bg-muted/80",
          !depth3 && isOwn && "rounded-2xl rounded-br-sm shadow-elevation-1",
          !depth3 && !isOwn && "rounded-2xl rounded-bl-sm",
          isOwn && "text-white",
        )}
        style={
          isOwn
            ? { background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)` }
            : depth3
              ? undefined
              : { background: COLORS.neutral.cream, color: COLORS.neutral.charcoal }
        }
      >
        <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        <div className={cn("flex items-center gap-1.5 mt-1", isOwn ? "justify-end" : "justify-start")}>
          <span className={cn("text-xs", isOwn ? "text-white/70" : "text-muted-foreground")}>
            {format(new Date(message.created_at), "HH:mm", { locale: sv })}
          </span>
          {isOwn &&
            (readAsText && message.is_read ? (
              <span className="text-xs text-white/70 shrink-0" aria-label="Läst">
                Läst
              </span>
            ) : !readAsText && message.is_read ? (
              <Check className="w-3.5 h-3.5 text-white shrink-0" aria-label="Läst" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white/60 shrink-0" aria-label="Skickat" />
            ))}
        </div>
      </div>
    </motion.div>
  );
});

export { ChatBubbleV2 };
