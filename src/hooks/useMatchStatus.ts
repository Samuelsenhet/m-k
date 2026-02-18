import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get Supabase URL - try multiple sources
      let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      
      // Construct from project ID if URL is not provided
      if ((!supabaseUrl || supabaseUrl.includes('your_project') || supabaseUrl.includes('placeholder')) && 
          projectId && 
          !projectId.includes('your_project') && 
          !projectId.includes('placeholder')) {
        supabaseUrl = `https://${projectId}.supabase.co`;
      }

      if (!supabaseUrl || supabaseUrl.includes('your_project') || supabaseUrl.includes('placeholder')) {
        throw new Error('Supabase URL is not configured. Please set VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID in your .env file.');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/match-status?user_id=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus
  };
}
