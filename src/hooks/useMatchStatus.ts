import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

interface MatchStatus {
  journey_phase: 'WAITING' | 'READY' | 'FIRST_MATCH';
  time_remaining: string;
  delivered_today: number;
  next_reset_time: string;
}

export function useMatchStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setError(new Error('No user logged in'));
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      let token = session?.access_token;
      if (!token) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        token = refreshed?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
      }
      if (!token) {
        setStatus(null);
        setError(new Error('Failed to obtain auth token'));
        setIsLoading(false);
        return;
      }

      const invoke = async (accessToken: string) =>
        supabase.functions.invoke('match-status', {
          body: { user_id: user.id },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      let { data, error } = await invoke(token);
      if (error) {
        await new Promise((r) => setTimeout(r, 1000));
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        const retryToken = refreshed?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
        if (retryToken) ({ data, error } = await invoke(retryToken));
      }
      if (error) throw error;
      if (!data) throw new Error('No data returned');

      setStatus(data as MatchStatus);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
