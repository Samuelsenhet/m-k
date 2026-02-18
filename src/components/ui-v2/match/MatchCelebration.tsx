import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AvatarWithRing } from "../avatar";
import { ButtonCoral } from "../button";
import { X } from "lucide-react";

export interface MatchCelebrationProps {
  /** Match id for Chatta link */
  matchId: string;
  displayName: string;
  avatarSrc?: string | null;
  /** Text from personality_insight – why you matched */
  personalityInsight?: string | null;
  onClose: () => void;
  /** Callback when user clicks Chatta (e.g. navigate then close) */
  onChatta?: () => void;
  /** Chatta button label */
  chattaLabel?: string;
}

/**
 * Modal shown when match.special_effects includes "celebration".
 * Overlapping AvatarWithRing, personality_insight text, CTA Chatta. Closable.
 */
export function MatchCelebration({
  matchId,
  displayName,
  avatarSrc,
  personalityInsight,
  onClose,
  onChatta,
  chattaLabel = "Chatta",
}: MatchCelebrationProps) {
  const handleChatta = () => {
    onChatta?.();
    onClose();
  };

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-dark/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-celebration-title"
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-border bg-card shadow-elevation-2",
          "animate-in zoom-in-95 duration-300"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
          aria-label="Stäng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-8 text-center space-y-6">
          <div id="match-celebration-title" className="sr-only">
            Matchning: {displayName}
          </div>

          {/* Overlapping avatar(s) – single match avatar with ring for celebration */}
          <div className="flex justify-center">
            <AvatarWithRing
              src={avatarSrc}
              alt={displayName}
              showRing
              ringVariant="coral"
              size="lg"
              className="ring-4 ring-primary/20"
            />
          </div>

          <div>
            <p className="text-lg font-semibold text-foreground">{displayName}</p>
            {personalityInsight && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {personalityInsight}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <ButtonCoral className="w-full" onClick={handleChatta}>
              {chattaLabel}
            </ButtonCoral>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
