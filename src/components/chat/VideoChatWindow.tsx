import React, { useRef, useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useTranslation } from "react-i18next";
import { X, User, Mic, MicOff, Video, VideoOff, Volume2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";
import { AvatarV2, AvatarV2Image, AvatarV2Fallback } from "@/components/ui-v2";
import { supabase } from "@/integrations/supabase/client";

interface VideoChatWindowProps {
  roomId: string;
  icebreakers?: string[];
  onEndCall: () => void;
  /** Optional: pass duration on end for call log */
  onEndCallWithDuration?: (durationSeconds: number) => void;
  /** Caller display name for header */
  callerName?: string;
  /** Caller avatar URL (storage path or full URL) */
  callerAvatar?: string | null;
}

function getAvatarUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data?.publicUrl;
}

export const VideoChatWindow: React.FC<VideoChatWindowProps> = ({
  roomId,
  icebreakers = [],
  onEndCall,
  onEndCallWithDuration,
  callerName = "Användare",
  callerAvatar,
}) => {
  const localVideoMainRef = useRef<HTMLVideoElement>(null);
  const localVideoPipRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const { sendMessage } = useRealtime({ roomId });
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartRef = useRef<number>(Date.now());
  const { t } = useTranslation();

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setHasLocalStream(true);
        if (localVideoMainRef.current) localVideoMainRef.current.srcObject = stream;
        if (localVideoPipRef.current) localVideoPipRef.current.srcObject = stream;
        pc = new RTCPeerConnection();
        stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
        setPeerConnection(pc);
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage({ type: "ice", candidate: event.candidate });
          }
        };
      })
      .catch((err) => { if (import.meta.env.DEV) console.error("getUserMedia error:", err); });
    return () => {
      if (pc) pc.close();
    };
  }, [sendMessage]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = muted;
      });
      setMuted(!muted);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !cameraOn;
      });
      setCameraOn(!cameraOn);
    }
  };

  const endCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    const duration = Math.round((Date.now() - callStartRef.current) / 1000);
    if (onEndCallWithDuration) {
      onEndCallWithDuration(duration);
    } else {
      onEndCall();
    }
  };

  const avatarUrl = getAvatarUrl(callerAvatar ?? undefined);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${COLORS.sage[200]} 0%, ${COLORS.coral[100]} 100%)`,
      }}
    >
      {/* Header – avatar + name + Kemi-Check, X */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 safe-area-top">
        <div
          className="flex items-center gap-3 rounded-full pl-1 pr-4 py-1"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
        >
          <AvatarV2 className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <AvatarV2Image src={avatarUrl} alt={callerName} />
            ) : (
              <AvatarV2Fallback className="bg-muted text-muted-foreground text-sm">
                {callerName.slice(0, 2).toUpperCase()}
              </AvatarV2Fallback>
            )}
          </AvatarV2>
          <div>
            <p className="font-semibold text-sm" style={{ color: COLORS.neutral.dark }}>
              {callerName}
            </p>
            <p className="text-xs" style={{ color: COLORS.primary[500] }}>
              {t("chat.kemiCheck")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={endCall}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)", color: COLORS.neutral.slate }}
          aria-label={t("common.close", "Stäng")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main video – remote or local */}
      <div className="relative flex-1 min-h-0 w-full pt-20 pb-32">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover rounded-3xl m-4",
            !hasRemoteStream && "hidden"
          )}
        />
        <video
          ref={localVideoMainRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover rounded-3xl m-4",
            hasRemoteStream && "hidden"
          )}
        />
        {/* Placeholder when no local stream yet */}
        {!hasLocalStream && (
          <div className="absolute inset-0 flex items-center justify-center m-4 rounded-3xl" style={{ background: "rgba(255,255,255,0.3)" }}>
            <User className="w-20 h-20" style={{ color: COLORS.neutral.white }} />
          </div>
        )}
      </div>

      {/* PiP – self video bottom-right, coral-100 */}
      <div
        className="absolute bottom-32 right-6 w-24 h-32 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center"
        style={{ background: COLORS.coral[100] }}
      >
        <video
          ref={localVideoPipRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {!hasLocalStream && (
          <User className="w-12 h-12 absolute" style={{ color: COLORS.coral[300] }} />
        )}
      </div>

      {/* Controls – Video, Mic, Volume2 (white), Hang up (coral-500, Phone 135deg) */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 safe-area-bottom">
        <button
          type="button"
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ background: "rgba(255,255,255,0.95)", color: COLORS.neutral.charcoal }}
          aria-label={t("chat.videoCall")}
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ background: "rgba(255,255,255,0.95)", color: COLORS.neutral.charcoal }}
          aria-label={muted ? t("chat.muted", "Dempad") : t("chat.mic", "Mikrofon")}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          type="button"
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ background: "rgba(255,255,255,0.95)", color: COLORS.neutral.charcoal }}
          aria-label={t("chat.volume", "Volym")}
        >
          <Volume2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={endCall}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ background: COLORS.coral[500], color: COLORS.neutral.white }}
          aria-label={t("chat.endCall", "Avsluta samtal")}
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};
