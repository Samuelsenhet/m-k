import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MatchList } from "@/components/chat/MatchList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { VideoChatWindow } from "@/components/chat/VideoChatWindow";
import { MessageCircle } from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { IncomingCallNotification } from "@/components/chat/IncomingCallNotification";
import { getProfilesAuthKey } from "@/lib/profiles";
import { useTranslation } from "react-i18next";
// Removed problematic import - check if CallHistory exists
// import { CallHistory, CallLogEntry } from '@/components/chat/CallHistory';

// Define CallLogEntry locally if the import doesn't work
interface CallLogEntry {
  type: "missed" | "completed" | "outgoing";
  timestamp: string;
  callerName: string;
  duration?: number;
}

interface SelectedMatch {
  id: string;
  matched_user_id: string;
  matched_profile?: {
    display_name: string;
    avatar_url: string | null;
    id_verification_status?: string | null;
  };
}

// Move CallHistoryDisplay outside parent for performance
function CallHistoryDisplay({ logs, className }: { logs: CallLogEntry[]; className?: string }) {
  if (logs.length === 0) return null;
  return (
    <div className={className ?? "p-4 border-t border-border bg-card"}>
      <h3 className="font-semibold text-sm mb-2 text-gray-600">
        Samtalshistorik
      </h3>
      <div className="space-y-2">
        {logs.slice(0, 3).map((log, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <span className="truncate">{log.callerName}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(log.timestamp).toLocaleDateString("sv-SE")}
              {log.type === "completed" &&
                log.duration &&
                ` • ${Math.floor(log.duration / 60)} min`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(
    null
  );
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [showPostVideoCard, setShowPostVideoCard] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    callerId: string;
  } | null>(null);
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/phone-auth");
    }
  }, [user, loading, navigate]);

  // Handle match query parameter
  const handleSelectMatch = useCallback(async (match: SelectedMatch) => {
    setSelectedMatch(match);
    // Icebreakers table does not exist in Supabase types. Remove this query to fix errors.
    setIcebreakers([]);
  }, []);

  const loadMatchFromUrl = useCallback(
    async (matchId: string) => {
      setLoadingMatch(true);
      try {
        // Fetch the match
        const { data: match, error } = await supabase
          .from("matches")
          .select("*")
          .eq("id", matchId)
          .single();

        if (error || !match) {
          if (import.meta.env.DEV) {
            console.error("Match not found:", error);
          }
          return;
        }

        // Determine the matched user ID
        const matchedUserId =
          match.user_id === user?.id ? match.matched_user_id : match.user_id;

        const profileKey = await getProfilesAuthKey(matchedUserId);
        // Fetch the profile (cast to avoid deep instantiation issues)
        const { data: profile, error: profileError } = (await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq(profileKey, matchedUserId)
          .single()) as unknown as {
          data: { display_name: string; avatar_url: string | null } | null;
          error: unknown;
        };
        // Type assertion to avoid deep type instantiation error
        const safeProfile = (profile as {
          display_name: string;
          avatar_url: string | null;
        }) ?? { display_name: "Användare", avatar_url: null };
        handleSelectMatch({
          id: matchId,
          matched_user_id: matchedUserId,
          matched_profile: safeProfile,
        });
      } finally {
        setLoadingMatch(false);
      }
    },
    [handleSelectMatch, user]
  );

  useEffect(() => {
    const matchId = searchParams.get("match");
    if (matchId && user && !selectedMatch) {
      loadMatchFromUrl(matchId);
    }
  }, [searchParams, user, selectedMatch, loadMatchFromUrl]);

  const handleBack = () => {
    setSelectedMatch(null);
    // Clear the URL parameter
    navigate("/chat", { replace: true });
  };

  // Example signaling: listen for incoming call requests
  useEffect(() => {
    if (!user) return;
    // Subscribe to realtime for incoming calls
    const channel = supabase.channel(`calls:${user.id}`);
    channel
      .on("broadcast", { event: "call_request" }, (payload) => {
        const { from, callerName } = payload.payload;
        if (from !== user.id) {
          setIncomingCall({ callerName, callerId: from });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAcceptCall = () => {
    if (!incomingCall || !selectedMatch) return;
    // Send accept signal
    supabase.channel(`calls:${incomingCall.callerId}`).send({
      type: "broadcast",
      event: "call_accepted",
      payload: {
        to: incomingCall.callerId,
        from: user?.id,
        matchId: selectedMatch.id,
      },
    });
    setIncomingCall(null);
    setVideoCallActive(true);
  };
  const handleDeclineCall = () => {
    if (incomingCall) {
      setCallLogs((logs) => [
        ...logs,
        {
          type: "missed",
          timestamp: new Date().toISOString(),
          callerName: incomingCall.callerName,
        },
      ]);
      // Send decline signal
      supabase.channel(`calls:${incomingCall.callerId}`).send({
        type: "broadcast",
        event: "call_declined",
        payload: { to: incomingCall.callerId, from: user?.id },
      });
      setIncomingCall(null);
    }
  };
  // When video call ends, add completed log
  const handleEndCall = (duration: number) => {
    setCallLogs((logs) => [
      ...logs,
      {
        type: "completed",
        timestamp: new Date().toISOString(),
        duration,
        callerName: selectedMatch?.matched_profile?.display_name || "Unknown",
      },
    ]);
    setVideoCallActive(false);
  };

  if (loading || loadingMatch) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  if (videoCallActive && selectedMatch) {
    return (
      <VideoChatWindow
        roomId={selectedMatch.id}
        icebreakers={icebreakers}
        onEndCall={() => handleEndCall(180)} // Example: 3 min call
      />
    );
  }

  if (incomingCall) {
    return (
      <IncomingCallNotification
        callerName={incomingCall.callerName}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 msn-chat">
      {selectedMatch ? (
        <>
          <ChatWindow
            matchId={selectedMatch.id}
            matchedUserId={selectedMatch.matched_user_id}
            matchedUserName={
              selectedMatch.matched_profile?.display_name || "Användare"
            }
            matchedUserAvatar={
              selectedMatch.matched_profile?.avatar_url || undefined
            }
            matchedUserVerified={
              selectedMatch.matched_profile?.id_verification_status === "approved"
            }
            icebreakers={icebreakers}
            onBack={handleBack}
            onStartVideo={() => setVideoCallActive(true)}
            showPostVideoCard={showPostVideoCard}
            onDismissPostVideoCard={() => setShowPostVideoCard(false)}
          />
          <CallHistoryDisplay logs={callLogs} className="msn-list-card border-t border-border mx-2 mb-2 rounded p-3 text-sm" />
        </>
      ) : (
        <>
          <div className="msn-list-header flex items-center gap-2 px-4 py-3 safe-area-top">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
            <h1 className="font-semibold text-base text-primary-foreground">{t('chat.conversations')}</h1>
          </div>
          <div className="flex-1 overflow-auto p-3 bg-background">
            <MatchList
              onSelectMatch={handleSelectMatch}
              selectedMatchId={selectedMatch?.id}
            />
          </div>
        </>
      )}
      {!selectedMatch && <BottomNav />}
    </div>
  );
}
