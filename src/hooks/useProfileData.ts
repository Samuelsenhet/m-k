import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getProfilesAuthKey } from '@/lib/profiles';

export interface ProfileData {
  archetype: string | null;
  displayName: string | null;
  isModerator: boolean | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches archetype (personality_results), display_name (profiles), and moderator status (moderator_roles).
 * Returns null-ish values until loaded; isModerator is false when not a moderator.
 * Exposes loading, error, and refetch for UI (e.g. retry, refresh after edit).
 */
export function useProfileData(userId: string | undefined): ProfileData {
  const [archetype, setArchetype] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArchetype = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('personality_results')
      .select('archetype, scores')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.archetype) {
      setArchetype(data.archetype);
    }
  }, [userId]);

  const fetchProfileAndModerator = useCallback(async () => {
    if (!userId) return;

    const profileKey = await getProfilesAuthKey(userId);
    const [profileRes, moderatorRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name')
        .eq(profileKey, userId)
        .maybeSingle(),
      supabase
        .from('moderator_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (profileRes.error) {
      setError(profileRes.error as unknown as Error);
      return;
    }
    setError(null);
    if (profileRes.data?.display_name != null) {
      setDisplayName(profileRes.data.display_name);
    }
    setIsModerator(!!moderatorRes.data);
  }, [userId]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      await Promise.all([fetchArchetype(), fetchProfileAndModerator()]);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [userId, fetchArchetype, fetchProfileAndModerator]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchArchetype(), fetchProfileAndModerator()])
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, fetchArchetype, fetchProfileAndModerator]);

  return { archetype, displayName, isModerator, loading, error, refetch };
}
