import * as React from "react";
import { ArrowLeft, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelationshipBorder } from "@/lib/relationship-depth";
import { AvatarWithRing } from "../avatar";
import { VerifiedBadge } from "@/components/ui-v2";
import { StatusBadge, type ChatStatusV2 } from "../badge";
import { COLORS } from "@/design/tokens";

export interface ChatHeaderV2Props {
  onBack: () => void;
  avatarSrc?: string | null;
  displayName: string;
  verified?: boolean;
  status?: ChatStatusV2;
  online?: boolean;
  /** Label when online (e.g. "Online nu") – design system primary-500 in light variant */
  onlineLabel?: string;
  onVideoClick?: () => void;
  showVideoButton?: boolean;
  /** Right slot e.g. dropdown menu trigger */
  rightSlot?: React.ReactNode;
  /** default = green header (primary); light = white header, primary-500 "Online nu" */
  variant?: "default" | "light";
  /** FAS Relationship Depth: 3+ adds subtle divider accent */
  relationshipLevel?: 1 | 2 | 3 | 4 | 5;
  /** Accessibility: back button label (e.g. "Tillbaka") */
  backLabel?: string;
  /** Accessibility: video button label (e.g. "Videoanrop") */
  videoLabel?: string;
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
      onlineLabel = "Online",
      onVideoClick,
      showVideoButton = false,
      rightSlot,
      variant = "default",
      relationshipLevel,
      backLabel = "Tillbaka",
      videoLabel = "Videoanrop",
      className,
    },
    ref,
  ) => {
    const isLight = variant === "light";
    const relationshipBorder = getRelationshipBorder(relationshipLevel);
    const hasDepthAccent = relationshipLevel != null && relationshipLevel >= 3;
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 safe-area-top shrink-0 border-b",
          !isLight && "bg-primary text-primary-foreground",
          isLight && hasDepthAccent && relationshipBorder,
          className,
        )}
        style={
          isLight
            ? {
                background: COLORS.neutral.white,
                borderColor: hasDepthAccent ? "hsl(var(--primary) / 0.2)" : COLORS.sage[100],
              }
            : undefined
        }
      >
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "p-2 rounded-full transition-colors duration-normal shrink-0",
            !isLight && "text-primary-foreground hover:bg-white/15",
          )}
          style={isLight ? { color: COLORS.neutral.charcoal } : undefined}
          aria-label={backLabel}
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
          <span
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold truncate",
              !isLight && "text-primary-foreground",
            )}
            style={isLight ? { color: COLORS.primary[800] } : undefined}
          >
            {displayName}
            {verified && (
              <VerifiedBadge
                size="sm"
                className={cn("shrink-0", !isLight && "text-primary-foreground")}
              />
            )}
          </span>
          {status != null ? (
            <StatusBadge
              status={status}
              className={cn(
                "w-fit text-xs",
                !isLight
                  ? "border-primary-foreground/30 text-primary-foreground bg-transparent"
                  : "",
              )}
            />
          ) : (
            <span
              className="text-xs truncate"
              style={
                isLight ? { color: COLORS.primary[500] } : { opacity: 0.8 }
              }
            >
              {onlineLabel}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1 shrink-0 [&_button]:text-inherit"
          style={isLight ? { color: COLORS.neutral.charcoal } : undefined}
        >
          {showVideoButton && onVideoClick != null && (
            <button
              type="button"
              className={cn(
                "p-2 rounded-full transition-colors duration-normal",
                !isLight && "bg-white/15 hover:bg-white/25 text-primary-foreground",
              )}
              style={isLight ? { color: COLORS.neutral.charcoal } : undefined}
              aria-label={videoLabel}
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
