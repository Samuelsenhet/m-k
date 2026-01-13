import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { MatchResult, calculateDailyMatches } from '@/lib/matching';
import { PersonalityCategory, DimensionKey } from '@/types/personality';

interface Match {
  id: string;
  matchedUser: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    category: PersonalityCategory;
    archetype?: string;
    bio?: string;
    photos?: string[];
  };
  matchType: 'similar' | 'complementary';
  matchScore: number;
  status: 'pending' | 'liked' | 'passed' | 'mutual';
  compatibilityFactors: string[];
  expiresAt: string;
  special_effects?: string[] | null;
  special_event_message?: string | null;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return fallback;
};

interface UseMatchesReturn {
  matches: Match[];
  loading: boolean;
  error: string | null;
  refreshMatches: () => Promise<void>;
  fetchMoreMatches: () => Promise<void>;
  hasMore: boolean;
  likeMatch: (matchId: string) => Promise<void>;
  passMatch: (matchId: string) => Promise<void>;
}

interface ProfileWithResults {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  personality_results: {
    category: string;
    scores: Record<DimensionKey, number>;
  }[];
}

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const { user } = useAuth();

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setMatches([]);
    setNextCursor(null);
    setHasMore(true);

    try {
      // Call the Edge Function for paginated matches
      const { data, error } = await supabase.functions.invoke('v1/match-daily', {
        body: {
          user_id: user.id,
          page_size: PAGE_SIZE,
        },
      });
      if (error) throw error;
      if (!data || !data.matches) {
        setMatches([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      setMatches(data.matches.map((m: any) => ({
        id: m.match_id,
        matchedUser: {
          userId: m.profile_id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          category: m.category || 'DIPLOMAT',
          archetype: m.archetype,
          bio: m.bio_preview,
          photos: m.photo_urls || [],
        },
        matchType: m.match_reason?.includes('liknande') ? 'similar' : 'complementary',
        matchScore: m.compatibility_percentage,
        status: 'pending',
        compatibilityFactors: [],
        expiresAt: m.expires_at,
        special_effects: m.special_effects,
        special_event_message: m.special_event_message,
      })));
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (err: unknown) {
      console.error('Error fetching matches:', err);
      setError(getErrorMessage(err, 'Kunde inte hämta matchningar'));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch more matches using cursor
  const fetchMoreMatches = useCallback(async () => {
    if (!user || !nextCursor || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('v1/match-daily', {
        body: {
          user_id: user.id,
          page_size: PAGE_SIZE,
          cursor: nextCursor,
        },
      });
      if (error) throw error;
      if (!data || !data.matches) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      setMatches((prev) => [
        ...prev,
        ...data.matches.map((m: any) => ({
          id: m.match_id,
          matchedUser: {
            userId: m.profile_id,
            displayName: m.display_name,
            avatarUrl: m.avatar_url,
            category: m.category || 'DIPLOMAT',
            archetype: m.archetype,
            bio: m.bio_preview,
            photos: m.photo_urls || [],
          },
          matchType: m.match_reason?.includes('liknande') ? 'similar' : 'complementary',
          matchScore: m.compatibility_percentage,
          status: 'pending',
          compatibilityFactors: [],
          expiresAt: m.expires_at,
          special_effects: m.special_effects,
          special_event_message: m.special_event_message,
        })),
      ]);
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (err: unknown) {
      console.error('Error fetching more matches:', err);
      setError(getErrorMessage(err, 'Kunde inte hämta fler matchningar'));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user, nextCursor, hasMore]);

      // No matches for today, generate new ones
      // Fetch all other users with personality results
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio')
        .neq('user_id', user.id);

      if (allProfilesError) throw allProfilesError;

      const { data: allResults, error: allResultsError } = await supabase
        .from('personality_results')
        .select('user_id, category, archetype, scores')
        .neq('user_id', user.id);

      if (allResultsError) throw allResultsError;

      // Create candidates from profiles with results
      const resultsMap = new Map(allResults?.map((r) => [r.user_id, r]));
      const profilesMap = new Map(allProfiles?.map((p) => [p.user_id, p]));

      const candidates = allResults
        ?.filter((r) => profilesMap.has(r.user_id))
        .map((r) => {
          const profile = profilesMap.get(r.user_id);
          return {
            userId: r.user_id,
            displayName: profile?.display_name || 'Anonym',
            avatarUrl: profile?.avatar_url || undefined,
            category: r.category as PersonalityCategory,
            archetype: r.archetype || undefined,
            scores: r.scores as Record<DimensionKey, number>,
            bio: profile?.bio || undefined,
          };
        }) || [];

      if (candidates.length === 0) {
        setMatches([]);
        setError('Inga matchningar tillgängliga just nu');
        setLoading(false);
        // Removed invalid return statement
      }

      // Calculate matches using our algorithm
      const currentUser = {
        userId: user.id,
        displayName: '',
        category: currentUserResult.category as PersonalityCategory,
        scores: currentUserScores,
      };

      const matchResults = calculateDailyMatches(
        currentUser,
        candidates,
        5, // Total matches (60% similar, 40% complementary)
        [] // No previous matched IDs for now
      );

      // Save matches to database
      const matchesToInsert = matchResults.map((m) => ({
        user_id: user.id,
        matched_user_id: m.user.userId,
        match_type: m.matchType,
        match_score: m.matchScore,
        status: 'pending',
        match_date: today,
      }));

      const { data: insertedMatches, error: insertError } = await supabase
        .from('matches')
        .insert(matchesToInsert)
        .select();

      if (insertError) throw insertError;

      const formattedMatches: Match[] = matchResults.map((m, i) => ({
        id: insertedMatches?.[i]?.id || `temp-${i}`,
        matchedUser: {
          userId: m.user.userId,
          displayName: m.user.displayName,
          avatarUrl: m.user.avatarUrl,
          category: m.user.category,
          archetype: m.user.archetype,
          bio: m.user.bio,
          photos: [],
        },
        matchType: m.matchType,
        matchScore: m.matchScore,
        status: 'pending' as const,
        compatibilityFactors: m.compatibilityFactors,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));

      setMatches(formattedMatches);
    } catch (err: unknown) {
      console.error('Error fetching matches:', err);
      setError(getErrorMessage(err, 'Kunde inte hämta matchningar'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const generateIcebreakers = async (matchId: string, userArchetype: string, matchedUserArchetype: string, userName: string, matchedUserName: string) => {
    try {
      const { error } = await supabase.functions.invoke('generate-icebreakers', {
        body: {
          matchId,
          userArchetype,
          matchedUserArchetype,
          userName,
          matchedUserName,
        },
      });
      
      if (error) {
        console.error('Error generating icebreakers:', error);
      }
    } catch (err: unknown) {
      console.error('Failed to generate icebreakers:', err);
    }
  };

  const likeMatch = async (matchId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'liked' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Check if the other user also liked us
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        const { data: reverseMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('user_id', match.matchedUser.userId)
          .eq('matched_user_id', user?.id)
          .eq('status', 'liked')
          .maybeSingle();

        if (reverseMatch) {
          // It's a mutual match!
          await supabase
            .from('matches')
            .update({ status: 'mutual' })
            .eq('id', matchId);
          
          await supabase
            .from('matches')
            .update({ status: 'mutual' })
            .eq('id', reverseMatch.id);

          // Get user's archetype for icebreaker generation
          const { data: userResult } = await supabase
            .from('personality_results')
            .select('archetype')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { data: matchedUserResult } = await supabase
            .from('personality_results')
            .select('archetype')
            .eq('user_id', match.matchedUser.userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { data: userProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', user?.id)
            .single();

          // Generate AI icebreakers for this mutual match
          generateIcebreakers(
            matchId,
            userResult?.archetype || 'DIPLOMAT',
            matchedUserResult?.archetype || 'DIPLOMAT',
            userProfile?.display_name || 'Användare',
            match.matchedUser.displayName
          );

          setMatches((prev) =>
            prev.map((m) =>
              m.id === matchId ? { ...m, status: 'mutual' } : m
            )
          );
          return;
        }
      }

      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: 'liked' } : m
        )
      );
    } catch (err: unknown) {
      console.error('Error liking match:', err);
    }
  };

  const passMatch = async (matchId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status: 'passed' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: 'passed' } : m
        )
      );
    } catch (err: unknown) {
      console.error('Error passing match:', err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    refreshMatches: fetchMatches,
    fetchMoreMatches,
    hasMore,
    likeMatch,
    passMatch,
  };
};
