import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface Match {
  id: string;
  matched_user_id: string;
  match_type: string;
  match_score: number;
  status: string;
  created_at: string;
  matched_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count?: number;
}

interface MatchListProps {
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string;
}

export function MatchList({ onSelectMatch, selectedMatchId }: MatchListProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMutualMatches();
    }
  }, [user]);

  const fetchMutualMatches = async () => {
    if (!user) return;

    // Fetch mutual matches
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
      .eq('status', 'mutual')
      .order('created_at', { ascending: false });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      setLoading(false);
      return;
    }

    // For each match, get the matched user's profile
    const matchesWithProfiles = await Promise.all(
      (matchesData || []).map(async (match) => {
        const matchedUserId = match.user_id === user.id 
          ? match.matched_user_id 
          : match.user_id;

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', matchedUserId)
          .single();

        // Get last message
        const { data: messageData } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        return {
          ...match,
          matched_user_id: matchedUserId,
          matched_profile: profileData || { display_name: 'Användare', avatar_url: null },
          last_message: messageData || undefined,
          unread_count: count || 0,
        };
      })
    );

    setMatches(matchesWithProfiles);
    setLoading(false);
  };

  const getPhotoUrl = (path: string | null) => {
    if (!path) return undefined;
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-serif font-semibold text-foreground mb-2">
          Inga matchningar ännu
        </h3>
        <p className="text-sm text-muted-foreground">
          När du och någon annan gillar varandra syns det här
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <Card
          key={match.id}
          onClick={() => onSelectMatch(match)}
          className={cn(
            'p-3 cursor-pointer transition-all hover:shadow-md',
            selectedMatchId === match.id && 'ring-2 ring-primary bg-primary/5'
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={getPhotoUrl(match.matched_profile?.avatar_url || null)} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {match.matched_profile?.display_name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground truncate">
                  {match.matched_profile?.display_name || 'Användare'}
                </h4>
                {match.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(match.last_message.created_at), {
                      addSuffix: true,
                      locale: sv,
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {match.last_message ? (
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {match.last_message.content}
                  </p>
                ) : (
                  <p className="text-sm text-primary flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Starta konversationen
                  </p>
                )}
                {match.unread_count && match.unread_count > 0 && (
                  <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                    {match.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
