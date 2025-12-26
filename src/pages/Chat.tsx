import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch | null>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSelectMatch = async (match: SelectedMatch) => {
    setSelectedMatch(match);
    
    // Fetch icebreakers for this match
    const { data } = await supabase
      .from('icebreakers')
      .select('icebreaker_text')
      .eq('match_id', match.id)
      .order('display_order');
    
    if (data && data.length > 0) {
      setIcebreakers(data.map(i => i.icebreaker_text));
    } else {
      setIcebreakers([]);
    }
  };

  if (loading) {
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
          onBack={() => setSelectedMatch(null)}
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
