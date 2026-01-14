import React, { useRef, useEffect, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";

interface VideoChatWindowProps {
  roomId: string;
  icebreakers: string[];
  onEndCall: () => void;
}

export const VideoChatWindow: React.FC<VideoChatWindowProps> = ({
  roomId,
  icebreakers,
  onEndCall,
}) => {
  const localVideoRef: React.RefObject<HTMLVideoElement> =
    useRef<HTMLVideoElement>(null);
  const remoteVideoRef: React.RefObject<HTMLVideoElement> =
    useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [currentIcebreaker, setCurrentIcebreaker] = useState(0);
  const { sendMessage, isConnected } = useRealtime({ roomId });
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const [pipActive, setPipActive] = useState(false);

  useEffect(() => {
    // Get local media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Setup peer connection
        const pc = new RTCPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        setPeerConnection(pc);
        // Handle remote stream
        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };
        // Handle signaling
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage({ type: "ice", candidate: event.candidate });
          }
        };
      });
    // Cleanup
    return () => {
      if (peerConnection) peerConnection.close();
    };
    // eslint-disable-next-line
  }, []);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!peerConnection) return;
    // Listen for signaling messages via Realtime
    // You need to implement receiving signaling messages in useRealtime and call below:
    // if (msg.type === 'offer') peerConnection.setRemoteDescription(new RTCSessionDescription(msg.offer));
    // if (msg.type === 'answer') peerConnection.setRemoteDescription(new RTCSessionDescription(msg.answer));
    // if (msg.type === 'ice') peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
  }, [peerConnection]);

  const handleNext = () =>
    setCurrentIcebreaker((i) => Math.min(i + 1, icebreakers.length - 1));
  const handlePrev = () => setCurrentIcebreaker((i) => Math.max(i - 1, 0));
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
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
  const startScreenShare = async () => {
    try {
      const screenStream = await (navigator.mediaDevices.getDisplayMedia({
        video: true,
      }) as Promise<MediaStream>);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      if (peerConnection) {
        screenStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, screenStream));
      }
      setScreenSharing(true);
      screenStream.getVideoTracks()[0].onended = () => {
        // Stop screen sharing
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setScreenSharing(false);
      };
    } catch (err: unknown) {
      console.error("Screen share error:", err);
    }
  };
  const togglePiP = async () => {
    if (localVideoRef.current) {
      if (!pipActive) {
        try {
          await (
            localVideoRef.current as HTMLVideoElement & {
              requestPictureInPicture: () => Promise<PictureInPictureWindow>;
            }
          ).requestPictureInPicture();
          setPipActive(true);
        } catch (err: unknown) {
          console.error("PiP error:", err);
        }
      } else {
        document.exitPictureInPicture();
        setPipActive(false);
      }
    }
  };

  useEffect(() => {
    const videoEl = localVideoRef.current;
    if (videoEl) {
      const handler = () => setPipActive(false);
      videoEl.addEventListener("leavepictureinpicture", handler);
      return () => {
        // Use a stable reference to the video element for cleanup
        const cleanupVideoEl = videoEl;
        cleanupVideoEl.removeEventListener("leavepictureinpicture", handler);
      };
    }
  }, []);

  const endCallForBoth = () => {
    // End call for both participants
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    onEndCall();
  };

  return (
    <div className="video-chat-window">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="local-video"
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="remote-video"
      />
      <div className="controls">
        <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
        <button onClick={toggleCamera}>
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </button>
        <button onClick={startScreenShare}>
          {screenSharing ? "Stop Sharing" : "Share Screen"}
        </button>
        <button onClick={togglePiP}>
          {pipActive ? "Exit PiP" : "Picture-in-Picture"}
        </button>
        <button onClick={endCallForBoth}>End Call</button>
      </div>
      <div className="icebreakers">
        <button onClick={handlePrev} disabled={currentIcebreaker === 0}>
          Previous
        </button>
        <span>{icebreakers[currentIcebreaker]}</span>
        <button
          onClick={handleNext}
          disabled={currentIcebreaker === icebreakers.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};
