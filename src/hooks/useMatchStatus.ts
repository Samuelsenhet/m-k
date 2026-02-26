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

      const { data: { user: validatedUser } } = await supabase.auth.getUser();
      if (!validatedUser) {
        setError(new Error('Not authenticated'));
        return;
      }

      let { data: { session } } = await supabase.auth.getSession();
      let token = session?.access_token;
      if (!token) {
        await new Promise((r) => setTimeout(r, 400));
        const refetched = await supabase.auth.getSession();
        session = refetched.data.session;
        token = session?.access_token;
      }
      if (!token) {
        if (import.meta.env.DEV) {
          console.warn("[match-status] No access_token – request would get 401. Ensure getSession() resolves before invoke. Check Edge Functions → Secrets (SUPABASE_URL, SUPABASE_ANON_KEY).");
        }
        setError(new Error('Not authenticated'));
        return;
      }

      if (import.meta.env.DEV) {
        console.debug("[match-status] Authorization header: yes", { tokenLength: token?.length ?? 0 });
      }

      const invokeStatus = async (accessToken: string) => {
        const { data, error } = await supabase.functions.invoke('match-status', {
          body: { user_id: userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return { data, error };
      };

      let result = await invokeStatus(token);
      if (result.error) {
        await new Promise((r) => setTimeout(r, 500));
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        const retryToken = refreshed?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
        if (retryToken) result = await invokeStatus(retryToken);
      }

      const { data, error } = result;
      if (error) {
        throw new Error(error.message ?? 'match-status failed');
      }
      if (data != null) {
        setStatus(data as MatchStatus);
      }
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
