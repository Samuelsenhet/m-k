import { X, User, Video, Mic, Volume2, Phone } from "lucide-react";
import { AvatarV2, AvatarV2Image, AvatarV2Fallback } from "../avatar";
import { COLORS } from "@/design/tokens";

export interface VideoCallScreenProps {
  callerName: string;
  callerAvatar?: string;
  /** Call duration display e.g. "05:32" */
  duration?: string;
  onEnd: () => void;
  onToggleVideo?: () => void;
  onToggleMic?: () => void;
}

/**
 * Kemi-Check video call screen – FAS 5.1.
 * Gradient sage→coral, header with avatar, video placeholder, PiP, control bar.
 */
export function VideoCallScreen({
  callerName,
  callerAvatar,
  duration = "00:00",
  onEnd,
  onToggleVideo,
  onToggleMic,
}: VideoCallScreenProps) {
  return (
    <div
      className="min-h-screen relative"
      style={{ background: COLORS.neutral.dark }}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div
          className="flex items-center gap-3 rounded-full pl-1 pr-4 py-1"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
        >
          <AvatarV2 className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            {callerAvatar ? (
              <AvatarV2Image src={callerAvatar} alt={callerName} />
            ) : (
              <AvatarV2Fallback className="bg-muted text-muted-foreground text-sm">
                {callerName.slice(0, 2).toUpperCase()}
              </AvatarV2Fallback>
            )}
          </AvatarV2>
          <div>
            <p className="font-semibold text-sm text-white">{callerName}</p>
            <p className="text-xs text-white/60">{duration} · Kemi-Check</p>
          </div>
        </div>
        <button
          type="button"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
          aria-label="Stäng"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main video placeholder */}
      <div className="w-full h-full flex items-center justify-center pt-20 pb-32">
        <div className="text-center">
          <div
            className="w-48 h-64 rounded-3xl mb-4 mx-auto flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <User className="w-20 h-20 text-white/70" />
          </div>
          <p className="text-white/60">Ansluter...</p>
        </div>
      </div>

      {/* Self video (PiP) */}
      <div
        className="absolute bottom-32 right-6 w-24 h-32 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
        style={{ background: COLORS.coral[100] }}
      >
        <User className="w-12 h-12" style={{ color: COLORS.coral[300] }} />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onToggleVideo}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.95)" }}
          aria-label="Växla video"
        >
          <Video className="w-5 h-5" style={{ color: COLORS.neutral.charcoal }} />
        </button>
        <button
          type="button"
          onClick={onToggleMic}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.95)" }}
          aria-label="Växla mikrofon"
        >
          <Mic className="w-5 h-5" style={{ color: COLORS.neutral.charcoal }} />
        </button>
        <button
          type="button"
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: "rgba(255,255,255,0.95)" }}
          aria-label="Volym"
        >
          <Volume2 className="w-5 h-5" style={{ color: COLORS.neutral.charcoal }} />
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: COLORS.coral[500] }}
          aria-label="Avsluta samtal"
        >
          <Phone className="w-6 h-6 text-white rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
