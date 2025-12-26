import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MatchList } from '@/components/chat/MatchList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ArrowLeft, MessageCircle } from 'lucide-react';

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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle match query parameter
  useEffect(() => {
    const matchId = searchParams.get('match');
    if (matchId && user && !selectedMatch) {
      loadMatchFromUrl(matchId);
    }
  }, [searchParams, user]);

  const loadMatchFromUrl = async (matchId: string) => {
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', matchedUserId)
        .single();

      handleSelectMatch({
        id: matchId,
        matched_user_id: matchedUserId,
        matched_profile: profile || { display_name: 'Användare', avatar_url: null },
      });
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleSelectMatch = async (match: SelectedMatch) => {
    setSelectedMatch(match);
    
    // Fetch icebreakers for this match
    const { data } = await supabase
      .from('icebreakers')
      .select('icebreaker_text')
      .eq('match_id', match.id)
      .eq('used', false)
      .order('display_order');
    
    if (data && data.length > 0) {
      setIcebreakers(data.map(i => i.icebreaker_text));
    } else {
      setIcebreakers([]);
    }
  };

  const handleBack = () => {
    setSelectedMatch(null);
    // Clear the URL parameter
    navigate('/chat', { replace: true });
  };

  if (loading || loadingMatch) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {selectedMatch ? (
        <ChatWindow
          matchId={selectedMatch.id}
          matchedUserId={selectedMatch.matched_user_id}
          matchedUserName={selectedMatch.matched_profile?.display_name || 'Användare'}
          matchedUserAvatar={selectedMatch.matched_profile?.avatar_url || undefined}
          icebreakers={icebreakers}
          onBack={handleBack}
        />
      ) : (
        <>
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h1 className="font-serif font-semibold text-lg">Meddelanden</h1>
              </div>
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
    </div>
  );
}
