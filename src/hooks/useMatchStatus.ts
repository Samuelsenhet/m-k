import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

interface MatchStatus {
  journey_phase: 'WAITING' | 'READY' | 'FIRST_MATCH';
  time_remaining: string;
  delivered_today: number;
  next_reset_time: string;
}

export function useMatchStatus() {
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const fetchingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!userId || authLoading || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // getSession auto-refreshes if the token is close to expiry.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(new Error('Not authenticated'));
        return;
      }

      const invokeStatus = (accessToken: string) =>
        supabase.functions.invoke('match-status', {
          body: { user_id: userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      let { data, error } = await invokeStatus(session.access_token);

      // On error, refresh once and retry.
      if (error) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) {
          ({ data, error } = await invokeStatus(refreshed.access_token));
        }
      }

      if (error) {
        const errObj = error as { message?: string; context?: { status?: number } };
        const is401 = errObj?.context?.status === 401 || /401|unauthorized/i.test(errObj?.message ?? '');
        if (import.meta.env.DEV && is401) {
          console.warn(
            '[match-status] 401 – Edge Function rejected auth. See docs/LAUNCH_401_CHECKLIST.md. Run: supabase link --project-ref <ref> then npm run edge:fix-401'
          );
        }
        throw new Error(error.message ?? 'match-status failed');
      }
      if (data != null) setStatus(data as MatchStatus);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, authLoading]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus
  };
}
