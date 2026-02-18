import * as React from "react";
import { ArrowLeft, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarWithRing } from "../avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { StatusBadge, type ChatStatusV2 } from "../badge";

export interface ChatHeaderV2Props {
  onBack: () => void;
  avatarSrc?: string | null;
  displayName: string;
  verified?: boolean;
  status?: ChatStatusV2;
  online?: boolean;
  onVideoClick?: () => void;
  showVideoButton?: boolean;
  /** Right slot e.g. dropdown menu trigger */
  rightSlot?: React.ReactNode;
  className?: string;
}

const ChatHeaderV2 = React.forwardRef<HTMLDivElement, ChatHeaderV2Props>(
  (
    {
      onBack,
      avatarSrc,
      displayName,
      verified = false,
      status,
      online,
      onVideoClick,
      showVideoButton = false,
      rightSlot,
      className,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 safe-area-top shrink-0",
          "bg-primary text-primary-foreground",
          className,
        )}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full text-primary-foreground hover:bg-white/15 transition-colors duration-normal shrink-0"
          aria-label="Tillbaka"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <AvatarWithRing
          showRing={false}
          src={avatarSrc}
          fallback={displayName.slice(0, 2).toUpperCase()}
          size="default"
          online={online}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="flex items-center gap-1.5 text-sm font-semibold truncate text-primary-foreground">
            {displayName}
            {verified && <VerifiedBadge size="sm" className="shrink-0 text-primary-foreground" />}
          </span>
          {status != null ? (
            <StatusBadge
              status={status}
              className="w-fit text-xs border-primary-foreground/30 text-primary-foreground bg-transparent"
            />
          ) : (
            <span className="text-xs text-primary-foreground/80 truncate">Online</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showVideoButton && onVideoClick != null && (
            <button
              type="button"
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground transition-colors duration-normal"
              aria-label="Videoanrop"
              onClick={onVideoClick}
            >
              <Video className="w-5 h-5" />
            </button>
          )}
          {rightSlot}
        </div>
      </div>
    );
  },
);
ChatHeaderV2.displayName = "ChatHeaderV2";

export { ChatHeaderV2 };
