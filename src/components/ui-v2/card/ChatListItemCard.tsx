import * as React from "react";
import { cn } from "@/lib/utils";
import { AvatarWithRing } from "../avatar";
import { StatusBadge, type ChatStatusV2 } from "../badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export interface ChatListItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
  displayName: string;
  lastMessagePreview?: string;
  timeLabel: string;
  status?: ChatStatusV2;
  avatarSrc?: string | null;
  avatarFallback?: string;
  showRing?: boolean;
  state?: "unread" | "active" | "idle";
  verified?: boolean;
}

const ChatListItemCard = React.forwardRef<HTMLDivElement, ChatListItemCardProps>(
  (
    {
      className,
      displayName,
      lastMessagePreview,
      timeLabel,
      status,
      avatarSrc,
      avatarFallback,
      showRing = false,
      state = "idle",
      verified = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-normal",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          state === "active" && "bg-coral/5",
          state === "unread" && "bg-muted/30",
          className,
        )}
        {...props}
      >
        <AvatarWithRing
          showRing={showRing}
          ringVariant="coral"
          src={avatarSrc}
          fallback={avatarFallback ?? displayName.slice(0, 2).toUpperCase()}
          size="default"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate font-semibold text-foreground">
              {displayName}
              {verified && <VerifiedBadge size="sm" className="shrink-0" />}
            </span>
            <span className="shrink-0 text-caption text-muted-foreground">{timeLabel}</span>
          </div>
          <div className="flex items-center gap-2 min-h-[1.25rem]">
            {lastMessagePreview != null && lastMessagePreview !== "" && (
              <span className="truncate text-sm text-muted-foreground">{lastMessagePreview}</span>
            )}
            {status != null && <StatusBadge status={status} className="shrink-0" />}
          </div>
        </div>
      </div>
    );
  },
);
ChatListItemCard.displayName = "ChatListItemCard";

export { ChatListItemCard };
