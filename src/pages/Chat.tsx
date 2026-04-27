import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMatches } from "@/hooks/useMatches";
import { MatchList } from "@/components/chat/MatchList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { VideoChatWindow } from "@/components/chat/VideoChatWindow";
import { GroupAvatar } from "@/components/chat/GroupAvatar";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { GroupChatRoom } from "@/components/chat/GroupChatRoom";
import { useGroups } from "@/hooks/useGroups";
import type { SamlingGroup } from "@/hooks/useGroups";
import { Search, Users, Plus, Filter } from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ButtonIcon, InputSearchV2 } from "@/components/ui-v2";
import { PageHeader } from "@/components/layout";
import { SCREEN_CONTAINER_CLASS } from "@/layout/screenLayout";
import { COLORS } from "@/design/tokens";
import { IncomingCallNotification } from "@/components/chat/IncomingCallNotification";
import { getProfilesAuthKey } from "@/lib/profiles";
import { isDemoEnabled } from "@/config/supabase";
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
function CallHistoryDisplay({ logs, className, title }: { logs: CallLogEntry[]; className?: string; title: string }) {
  if (logs.length === 0) return null;
  return (
    <div className={className ?? "p-4 border-t border-border bg-card"}>
      <h3 className="font-semibold text-sm mb-2 text-muted-foreground">
        {title}
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
  const [chatSearchQuery, setChatSearchQuery] = useState(""); // chat list search (used in input + MatchList)
  const [selectedGroup, setSelectedGroup] = useState<SamlingGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { groups, createGroup, leaveGroup, refreshGroups } = useGroups();
  const [pendingOpenGroupId, setPendingOpenGroupId] = useState<string | null>(null);
  const [chatTab, setChatTab] = useState<"chatt" | "samling">("chatt");
  const { matches } = useMatches();
  const openMatch = selectedMatch ? matches.find((m) => m.id === selectedMatch.id) : undefined;
  const relationshipLevel = openMatch?.status === "mutual" ? 3 : openMatch ? 2 : undefined;

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
            if (import.meta.env.DEV) console.error("Match not found:", error);
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

  useEffect(() => {
    if (pendingOpenGroupId && groups.some((g) => g.id === pendingOpenGroupId)) {
      const g = groups.find((x) => x.id === pendingOpenGroupId);
      if (g) setSelectedGroup(g);
      setPendingOpenGroupId(null);
    }
  }, [groups, pendingOpenGroupId]);

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

  if (selectedGroup) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-16">
        <div className="flex-1 flex flex-col min-h-0">
          <GroupChatRoom
            group={selectedGroup}
            currentUserId={user.id}
            onBack={() => setSelectedGroup(null)}
            leaveGroup={leaveGroup}
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (videoCallActive && selectedMatch) {
    return (
      <VideoChatWindow
        roomId={selectedMatch.id}
        icebreakers={icebreakers}
        onEndCall={() => setVideoCallActive(false)}
        onEndCallWithDuration={(duration) => handleEndCall(duration)}
        callerName={selectedMatch.matched_profile?.display_name ?? "Användare"}
        callerAvatar={selectedMatch.matched_profile?.avatar_url ?? undefined}
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
    <div className="min-h-screen flex flex-col bg-background pb-24 safe-area-bottom">
      {selectedMatch ? (
        <div className="flex flex-1 flex-col min-h-0 msn-chat">
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
            relationshipLevel={relationshipLevel}
            icebreakers={icebreakers}
            onBack={handleBack}
            onStartVideo={() => setVideoCallActive(true)}
            showPostVideoCard={showPostVideoCard}
            onDismissPostVideoCard={() => setShowPostVideoCard(false)}
          />
          <CallHistoryDisplay logs={callLogs} title={t('chat.call_history')} className="msn-list-card border-t border-border mx-2 mb-2 rounded p-3 text-sm shrink-0" />
        </div>
      ) : (
        <div className={SCREEN_CONTAINER_CLASS}>
          <div className="space-y-6">
            <PageHeader
              title={t("chat.chats")}
              actions={
                <div className="flex gap-2 shrink-0">
                  <ButtonIcon variant="ghost" size="sm" aria-label={t("chat.filter", "Filter")}>
                    <Filter className="w-4 h-4" />
                  </ButtonIcon>
                  <ButtonIcon
                    variant="ghost"
                    size="sm"
                    aria-label={t("chat.search")}
                    onClick={() => document.getElementById("chat-search")?.focus()}
                  >
                    <Search className="w-4 h-4" />
                  </ButtonIcon>
                  {isDemoEnabled && (
                    <Link to="/demo-seed" className="p-2 rounded-full text-xs font-medium shrink-0" style={{ color: COLORS.neutral.gray }}>
                      Demo
                    </Link>
                  )}
                </div>
              }
            />

            {/* Tabs: Chatt | Samling */}
            <div className="flex rounded-xl p-1 min-h-[44px]" style={{ background: COLORS.sage[100] }}>
              <button
                type="button"
                onClick={() => setChatTab("chatt")}
                className="flex-1 py-3 px-4 text-center font-semibold rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                style={{
                  color: chatTab === "chatt" ? COLORS.primary[800] : COLORS.neutral.gray,
                  background: chatTab === "chatt" ? COLORS.neutral.white : "transparent",
                  boxShadow: chatTab === "chatt" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Chatt
              </button>
              <button
                type="button"
                onClick={() => setChatTab("samling")}
                className="flex-1 py-3 px-4 text-center font-semibold rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                style={{
                  color: chatTab === "samling" ? COLORS.primary[800] : COLORS.neutral.gray,
                  background: chatTab === "samling" ? COLORS.neutral.white : "transparent",
                  boxShadow: chatTab === "samling" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                Samling
              </button>
            </div>

            {chatTab === "chatt" && (
              <InputSearchV2
                leftIcon={<Search className="w-4 h-4" style={{ color: COLORS.neutral.gray }} />}
                id="chat-search"
                name="chatSearch"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder={t("chat.search")}
                aria-label={t("chat.search")}
                className="min-w-0"
              />
            )}

            {chatTab === "samling" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: COLORS.primary[800] }}>
                    <Users className="w-4 h-4" />
                    Samlingar
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(true)}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-90"
                    style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
                    aria-label={t("chat.createGroup")}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {groups.length > 0 ? (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGroup(g)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left"
                        style={{ background: COLORS.neutral.white }}
                      >
                        <GroupAvatar members={g.members} size={52} showCount />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: COLORS.neutral.dark }}>{g.name}</p>
                          <p className="text-xs truncate" style={{ color: COLORS.neutral.gray }}>{g.members.map((m) => m.display_name ?? "?").join(", ")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: COLORS.neutral.gray }}>{t("groupChat.inlineEmpty")}</p>
                )}
              </div>
            ) : (
              <div className="min-h-[200px]">
                <MatchList
                  onSelectMatch={handleSelectMatch}
                  selectedMatchId={selectedMatch?.id}
                  searchQuery={chatSearchQuery}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={(groupId) => {
          setShowCreateGroup(false);
          setPendingOpenGroupId(groupId);
        }}
        createGroup={createGroup}
      />
      {!selectedMatch && !selectedGroup && <BottomNav />}
    </div>
  );
}
