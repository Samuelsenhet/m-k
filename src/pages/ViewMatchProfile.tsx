import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MatchProfileView } from '@/components/profile/MatchProfileView';
import { useMatches } from '@/hooks/useMatches';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ViewMatchProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('match');
  const navigate = useNavigate();
  const { matches, likeMatch, passMatch } = useMatches();
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const matchScore = matchId ? matches.find((m) => m.id === matchId)?.matchScore : undefined;

  useEffect(() => {
    if (matchId && !userId) {
      setLoading(true);
      // If we have a matchId but no userId, fetch the matched user ID
      const fetchMatchedUserId = async () => {
        const { data: match } = await supabase
          .from('matches')
          .select('user_id, matched_user_id')
          .eq('id', matchId)
          .single();

        if (match) {
          // Get current user to determine which is the matched user
          const { data: { user } } = await supabase.auth.getUser();
          const matchedId = match.user_id === user?.id 
            ? match.matched_user_id 
            : match.user_id;
          setMatchedUserId(matchedId);
        }
        setLoading(false);
      };
      fetchMatchedUserId();
    } else if (userId) {
      setMatchedUserId(userId);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [matchId, userId]);

  const handleLike = async () => {
    if (matchId) {
      await likeMatch(matchId);
      navigate('/matches');
    }
  };

  const handlePass = async () => {
    if (matchId) {
      await passMatch(matchId);
      navigate('/matches');
    }
  };

  if (loading || !matchedUserId) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <MatchProfileView
      userId={matchedUserId}
      matchId={matchId || undefined}
      onBack={() => navigate(-1)}
      onLike={handleLike}
      onPass={handlePass}
    />
  );
}
