import { useRealtimeRN } from "@/hooks/useRealtimeRN";
import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, NativeModules, Pressable, StyleSheet, Text, View } from "react-native";

// Lazy-require so Expo Go (no native module) doesn't crash on import.
const hasWebRTC = !!NativeModules.WebRTCModule;
const WebRTC = hasWebRTC ? require("react-native-webrtc") : null;
const RTCPeerConnection = WebRTC?.RTCPeerConnection;
const RTCView = WebRTC?.RTCView;
const mediaDevices = WebRTC?.mediaDevices;
type RTCMediaStream = any;

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type SignalMessage =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice"; candidate: unknown }
  | { type: "hangup" };

type Props = {
  matchId: string;
  matchedUserName: string;
  isInitiator: boolean;
  onEnd: (durationSeconds: number) => void;
};

/**
 * Kemi-Check video call — port of web `VideoChatWindow.tsx`.
 * Uses plain WebRTC with Supabase Realtime signaling.
 */
export function KemiCheckRN({ matchId, matchedUserName, isInitiator, onEnd }: Props) {
  const { t } = useTranslation();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<RTCMediaStream | null>(null);
  const startTimeRef = useRef(Date.now());

  const [localStreamURL, setLocalStreamURL] = useState<string | null>(null);
  const [remoteStreamURL, setRemoteStreamURL] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [connected]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const hangup = useCallback(() => {
    const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    onEnd(dur);
  }, [onEnd]);

  // Handle incoming signals
  const handleSignal = useCallback(
    async (msg: SignalMessage) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (msg.type === "offer") {
        await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendRef.current?.({ type: "answer", sdp: answer.sdp! });
      } else if (msg.type === "answer") {
        await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
      } else if (msg.type === "ice" && msg.candidate) {
        await pc.addIceCandidate(msg.candidate as RTCIceCandidateInit);
      } else if (msg.type === "hangup") {
        hangup();
      }
    },
    [hangup],
  );

  const { sendMessage, isConnected: rtConnected } = useRealtimeRN<SignalMessage>({
    roomId: matchId,
    onMessage: handleSignal,
  });
  const sendRef = useRef(sendMessage);
  useEffect(() => {
    sendRef.current = sendMessage;
  }, [sendMessage]);

  // Setup WebRTC on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = (await mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })) as RTCMediaStream;

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStreamURL((stream as unknown as { toURL: () => string }).toURL());

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.addEventListener("track", (event: unknown) => {
          const ev = event as { streams?: RTCMediaStream[] };
          const remote = ev.streams?.[0];
          if (remote) {
            setRemoteStreamURL((remote as unknown as { toURL: () => string }).toURL());
            setConnected(true);
            startTimeRef.current = Date.now();
          }
        });

        pc.addEventListener("icecandidate", (event: unknown) => {
          const ev = event as { candidate?: unknown };
          if (ev.candidate) {
            sendRef.current?.({ type: "ice", candidate: ev.candidate });
          }
        });

        // Initiator creates offer once realtime channel is ready
        if (isInitiator && rtConnected) {
          const offer = await pc.createOffer({});
          await pc.setLocalDescription(offer);
          sendRef.current?.({ type: "offer", sdp: offer.sdp! });
        }
      } catch (err) {
        if (__DEV__) console.error("[KemiCheckRN] setup:", err);
      }
    })();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, [isInitiator, rtConnected]);

  // Send offer when channel becomes ready (if initiator and PC exists)
  useEffect(() => {
    if (!isInitiator || !rtConnected || !pcRef.current) return;
    const pc = pcRef.current;
    if (pc.localDescription) return; // already sent
    (async () => {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      sendRef.current?.({ type: "offer", sdp: offer.sdp! });
    })();
  }, [isInitiator, rtConnected]);

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMuted((m) => !m);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCameraOn((c) => !c);
  };

  const endCall = () => {
    sendRef.current?.({ type: "hangup" });
    hangup();
  };

  return (
    <View style={styles.root}>
      {/* Remote video (fullscreen) */}
      {remoteStreamURL ? (
        <RTCView streamURL={remoteStreamURL} style={styles.remoteVideo} objectFit="cover" />
      ) : (
        <View style={styles.waitingWrap}>
          <Image source={MascotAssets.waitingTea} style={styles.waitingMascot} resizeMode="contain" />
          <Text style={styles.waitingText}>
            {t("mobile.kemicheck.waiting", { name: matchedUserName })}
          </Text>
        </View>
      )}

      {/* Local video (pip) */}
      {localStreamURL ? (
        <RTCView streamURL={localStreamURL} style={styles.localPip} objectFit="cover" mirror />
      ) : null}

      {/* Timer */}
      {connected ? (
        <View style={styles.timerWrap}>
          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        </View>
      ) : null}

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable style={[styles.ctrlBtn, muted && styles.ctrlBtnOff]} onPress={toggleMute}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
        </Pressable>
        <Pressable style={[styles.ctrlBtn, !cameraOn && styles.ctrlBtnOff]} onPress={toggleCamera}>
          <Ionicons name={cameraOn ? "videocam" : "videocam-off"} size={24} color="#fff" />
        </Pressable>
        <Pressable style={styles.endBtn} onPress={endCall}>
          <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  remoteVideo: { flex: 1 },
  localPip: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
  },
  waitingWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  waitingMascot: { width: 100, height: 100, marginBottom: 16 },
  waitingText: { fontSize: 16, color: "#ccc", textAlign: "center" },
  timerWrap: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  controls: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  ctrlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlBtnOff: { backgroundColor: "rgba(255,80,80,0.6)" },
  endBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: maakTokens.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
});
