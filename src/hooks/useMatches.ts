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

export const useMatches = (): UseMatchesReturn => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // First, check if user has personality results
      const { data: userResults, error: resultsError } = await supabase
        .from('personality_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (resultsError) throw resultsError;
      
      if (!userResults || userResults.length === 0) {
        setMatches([]);
        setError('Slutför personlighetstestet för att se matchningar');
        setLoading(false);
        return;
      }

      const currentUserResult = userResults[0];
      const currentUserScores = currentUserResult.scores as Record<DimensionKey, number>;

      // Check for existing matches for today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .eq('match_date', today);

      if (matchesError) throw matchesError;

      // If we have matches for today, use them
      if (existingMatches && existingMatches.length > 0) {
        // Fetch matched user profiles
        const matchedUserIds = existingMatches.map((m) => m.matched_user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, bio')
          .in('user_id', matchedUserIds);

        if (profilesError) throw profilesError;

        const { data: personalityData, error: personalityError } = await supabase
          .from('personality_results')
          .select('user_id, category, archetype')
          .in('user_id', matchedUserIds);

        if (personalityError) throw personalityError;

        // Fetch profile photos for matched users
        const { data: photosData, error: photosError } = await supabase
          .from('profile_photos')
          .select('user_id, storage_path, display_order')
          .in('user_id', matchedUserIds)
          .order('display_order', { ascending: true });

        if (photosError) throw photosError;

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
        const categoryMap = new Map(personalityData?.map((p) => [p.user_id, { category: p.category, archetype: p.archetype }]));
        
        // Group photos by user
        const photosMap = new Map<string, string[]>();
        photosData?.forEach((photo) => {
          const existing = photosMap.get(photo.user_id) || [];
          existing.push(photo.storage_path);
          photosMap.set(photo.user_id, existing);
        });

        const formattedMatches: Match[] = existingMatches.map((m) => {
          const profile = profileMap.get(m.matched_user_id);
          const personality = categoryMap.get(m.matched_user_id);
          const photos = photosMap.get(m.matched_user_id) || [];
          
          return {
            id: m.id,
            matchedUser: {
              userId: m.matched_user_id,
              displayName: profile?.display_name || 'Anonym',
              avatarUrl: profile?.avatar_url || undefined,
              category: (personality?.category || 'DIPLOMAT') as PersonalityCategory,
              archetype: personality?.archetype || undefined,
              bio: profile?.bio || undefined,
              photos,
            },
            matchType: m.match_type as 'similar' | 'complementary',
            matchScore: Number(m.match_score),
            status: m.status as Match['status'],
            compatibilityFactors: [],
            expiresAt: m.expires_at,
            special_effects: m.special_effects,
            special_event_message: m.special_event_message,
          };
        });

        setMatches(formattedMatches);
        setLoading(false);
        return;
      }

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
        return;
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
    likeMatch,
    passMatch,
  };
};
