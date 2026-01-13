import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MatchList } from '@/components/chat/MatchList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { VideoChatWindow } from '@/components/chat/VideoChatWindow';
import { MessageCircle } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { useRealtime } from '@/hooks/useRealtime';
import { IncomingCallNotification } from '@/components/chat/IncomingCallNotification';
import { CallHistory, CallLogEntry } from '@/components/chat/CallHistory';

interface SelectedMatch {
  id: string;
  matched_user_id: string;
  matched_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function Chat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerName: string; callerId: string } | null>(null);
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);

  // Add a dummy roomId for connection check (could be user.id or a global room)
  const { isConnected: realtimeConnected } = useRealtime({ roomId: user?.id || 'global' });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/phone-auth');
    }
  }, [user, loading, navigate]);

  // Handle match query parameter
  const handleSelectMatch = useCallback(async (match: SelectedMatch) => {
    setSelectedMatch(match);
    // Icebreakers table does not exist in Supabase types. Remove this query to fix errors.
    setIcebreakers([]);
  }, []);

  const loadMatchFromUrl = useCallback(async (matchId: string) => {
    setLoadingMatch(true);
    try {
      // Fetch the match
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error || !match) {
        console.error('Match not found:', error);
        return;
      }

      // Determine the matched user ID
      const matchedUserId = match.user_id === user?.id 
        ? match.matched_user_id 
        : match.user_id;

      // Fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', matchedUserId)
        .single();

      const safeProfile = (profile as { display_name: string; avatar_url: string | null } | null) || { display_name: 'Användare', avatar_url: null };
      handleSelectMatch({
        id: matchId,
        matched_user_id: matchedUserId,
        matched_profile: !profileError ? safeProfile : { display_name: 'Användare', avatar_url: null },
      });
    } finally {
      setLoadingMatch(false);
    }
  }, [handleSelectMatch, user]);

  useEffect(() => {
    const matchId = searchParams.get('match');
    if (matchId && user && !selectedMatch) {
      loadMatchFromUrl(matchId);
    }
  }, [searchParams, user, selectedMatch, loadMatchFromUrl]);

  const handleBack = () => {
    setSelectedMatch(null);
    // Clear the URL parameter
    navigate('/chat', { replace: true });
  };

  // Example signaling: listen for incoming call requests
  useEffect(() => {
    // This is a placeholder for receiving signaling messages via Realtime
    // Replace with your actual Realtime subscription logic
    const handleSignal = (msg: any) => {
      if (msg.type === 'call_request' && msg.to === user?.id) {
        setIncomingCall({ callerName: msg.callerName, callerId: msg.from });
      }
    };
    // Subscribe to signaling channel here
    // ...existing code...
    return () => {
      // Unsubscribe
    };
  }, [user]);

  const handleAcceptCall = () => {
    setIncomingCall(null);
    setVideoCallActive(true);
    // Send accept signal via Realtime
    // ...
  };
  const handleDeclineCall = () => {
    setCallLogs((logs) => [
      ...logs,
      {
        type: 'missed',
        timestamp: new Date().toISOString(),
        callerName: incomingCall?.callerName || 'Unknown',
      },
    ]);
    setIncomingCall(null);
    // Send decline signal via Realtime
    // ...
  };
  // When video call ends, add completed log
  const handleEndCall = (duration: number) => {
    setCallLogs((logs) => [
      ...logs,
      {
        type: 'completed',
        timestamp: new Date().toISOString(),
        duration,
        callerName: selectedMatch?.matched_profile?.display_name || 'Unknown',
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

  if (!realtimeConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <h2 className="font-semibold text-lg mb-2">Real-time chat är tillfälligt otillgängligt</h2>
          <p>Du kan fortfarande läsa gamla meddelanden, men nya meddelanden visas inte direkt. Försök igen senare.</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen flex flex-col bg-background pb-16">
      {selectedMatch ? (
        <>
          <ChatWindow
            matchId={selectedMatch.id}
            matchedUserId={selectedMatch.matched_user_id}
            matchedUserName={selectedMatch.matched_profile?.display_name || 'Användare'}
            matchedUserAvatar={selectedMatch.matched_profile?.avatar_url || undefined}
            icebreakers={icebreakers}
            onBack={handleBack}
          />
          <div className="p-4 flex justify-center">
            <button
              className="bg-primary text-white px-4 py-2 rounded-full shadow"
              onClick={() => setVideoCallActive(true)}
            >
              Starta videochatt
            </button>
          </div>
          <CallHistory logs={callLogs} />
        </>
      ) : (
        <>
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h1 className="font-serif font-semibold text-lg">Meddelanden</h1>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
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
