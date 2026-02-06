import React, { useRef, useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  MessageCircle,
  PhoneOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoChatWindowProps {
  roomId: string;
  icebreakers?: string[];
  onEndCall: () => void;
  /** Optional: pass duration on end for call log */
  onEndCallWithDuration?: (durationSeconds: number) => void;
}

export const VideoChatWindow: React.FC<VideoChatWindowProps> = ({
  roomId,
  icebreakers = [],
  onEndCall,
  onEndCallWithDuration,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const { sendMessage } = useRealtime({ roomId });
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [volume, setVolume] = useState(80);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartRef = useRef<number>(Date.now());
  const { t } = useTranslation();

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
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
      .catch((err) => console.error("getUserMedia error:", err));
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Main video – remote (full screen); fallback to local when no remote */}
      <div className="relative flex-1 min-h-0 w-full">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* If no remote stream yet, show local as main */}
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            remoteVideoRef.current?.srcObject ? "hidden" : ""
          )}
        />

        {/* PiP – local (or remote when we have both) in top-right, MSN-style rounded */}
        <div className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </div>

        {/* Back / minimize – top left */}
        <button
          type="button"
          onClick={endCall}
          className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Volume slider – left side, vertical, MÄÄK green */}
        <div className="absolute left-4 bottom-24 z-10 flex flex-col items-center gap-2">
          <div className="h-24 w-2 rounded-full bg-black/40 overflow-hidden">
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-primary/60 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow"
              style={{ writingMode: "vertical-lr", direction: "rtl" }}
            />
          </div>
          <Volume2 className="h-5 w-5 text-white/90" aria-hidden />
        </div>
      </div>

      {/* Bottom control bar – dark green, MSN/Kemi-Check style */}
      <div className="shrink-0 flex items-center justify-center gap-4 px-4 py-4 safe-area-bottom bg-gradient-to-t from-gray-950 to-gray-900/95 border-t border-white/10">
        <button
          type="button"
          onClick={toggleMute}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label={muted ? t("chat.voiceMsg") : t("chat.voiceMsg")}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label={t("chat.videoCall")}
        >
          <Volume2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label={cameraOn ? t("chat.videoCall") : t("chat.videoCall")}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
          aria-label={t("chat.messages")}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={endCall}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg"
          aria-label={t("chat.kemiCheck")}
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};
