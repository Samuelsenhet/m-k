import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AvatarWithRing } from "../avatar";
import { ButtonCoral } from "../button";
import { COLORS } from "@/design/tokens";
import { X } from "lucide-react";
import { Mascot } from "@/components/system/Mascot";

export interface MatchCelebrationProps {
  matchId: string;
  displayName: string;
  avatarSrc?: string | null;
  /** Optional: show overlapping "Du" + match avatars when provided */
  userAvatarSrc?: string | null;
  userArchetype?: string;
  /** "similar" | "complementary" – for likhet/motsats copy and badge */
  matchType?: "similar" | "complementary";
  personalityInsight?: string | null;
  onClose: () => void;
  onChatta?: () => void;
  chattaLabel?: string;
}

const COPY = {
  similar: {
    typ: "likhets",
    tagline: "Ni delar viktiga värderingar",
  },
  complementary: {
    typ: "motsats",
    tagline: "Era olikheter kompletterar varandra",
  },
} as const;

/**
 * Match celebration modal – dark overlay, "Ny matchning!", overlapping avatars,
 * match type badge (no %), tagline, Fortsätt + Skicka meddelande (ButtonCoral).
 */
export function MatchCelebration({
  displayName,
  avatarSrc,
  userAvatarSrc,
  userArchetype,
  matchType = "similar",
  personalityInsight,
  onClose,
  onChatta,
  chattaLabel = "Skicka meddelande",
}: MatchCelebrationProps) {
  const handleChatta = () => {
    onChatta?.();
    onClose();
  };

  const { typ, tagline } = COPY[matchType];

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        background: "rgba(15, 18, 17, 0.92)",
        backdropFilter: "blur(16px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-celebration-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-elevation-2 animate-in zoom-in-95 duration-300 overflow-hidden"
        style={{ background: COLORS.neutral.dark }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Stäng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-10 text-center space-y-5">
          {/* Mascot */}
          <div className="flex justify-center">
            <Mascot token="mascot_lighting_lantern" size="medium" placement="center" animation="celebrate-bounce" />
          </div>

          <h2 id="match-celebration-title" className="text-2xl font-bold text-white">
            Ny matchning!
          </h2>

          <p className="text-white/90 text-sm">
            Du och {displayName} är en {typ}-match
          </p>

          {/* Overlapping avatars – user (left) + match (right) when userAvatarSrc provided, else single match */}
          <div className="flex justify-center items-center gap-0">
            {userAvatarSrc != null || userArchetype ? (
              <>
                <div className="relative z-10">
                  <AvatarWithRing
                    src={userAvatarSrc ?? undefined}
                    alt="Du"
                    fallback={<span className="text-2xl">👤</span>}
                    showRing={false}
                    size="lg"
                    className="ring-2 ring-white/30"
                  />
                </div>
                <div className="relative -ml-6 z-0">
                  <AvatarWithRing
                    src={avatarSrc}
                    alt={displayName}
                    showRing
                    ringVariant="coral"
                    size="lg"
                    className="ring-2 ring-white/30"
                  />
                </div>
              </>
            ) : (
              <div className="relative flex justify-center">
                <AvatarWithRing
                  src={avatarSrc}
                  alt={displayName}
                  showRing
                  ringVariant="coral"
                  size="lg"
                  className="relative z-10 ring-2 ring-white/30"
                />
              </div>
            )}
          </div>

          {/* Match type badge – no percent, rgba */}
          <div
            className="inline-block px-4 py-2 rounded-full text-sm font-medium text-white/95"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {typ === "likhets" ? "Likhets-match" : "Motsats-match"}
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            {tagline}
          </p>
          {personalityInsight && (
            <p className="text-xs text-white/70 leading-relaxed">
              {personalityInsight}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <ButtonCoral className="w-full" onClick={handleChatta}>
              {chattaLabel}
            </ButtonCoral>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-xl"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              Fortsätt
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
