import { useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { IcebreakerCategory } from '@/types/api';

/**
 * Hook for tracking icebreaker analytics
 * All tracking functions are fire-and-forget (non-blocking)
 * Errors are logged but don't break the UI
 */
export function useIcebreakerAnalytics() {
  const { user } = useAuth();

  /**
   * Track when icebreakers are shown to the user
   */
  const trackIcebreakerShown = useCallback(
    async (
      matchId: string,
      icebreaker: string,
      category: IcebreakerCategory | null = null
    ): Promise<void> => {
      if (!user) return;

      try {
        await supabase.from('icebreaker_analytics').insert({
          match_id: matchId,
          user_id: user.id,
          icebreaker_text: icebreaker,
          category,
          was_used: false,
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to track icebreaker shown:', error);
      }
    },
    [user]
  );

  /**
   * Track when user clicks/sends an icebreaker
   */
  const trackIcebreakerUsed = useCallback(
    async (matchId: string, icebreakerText: string): Promise<void> => {
      if (!user) return;

      try {
        // Update existing record if exists, otherwise insert new
        const { data: existing } = await supabase
          .from('icebreaker_analytics')
          .select('id')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .eq('icebreaker_text', icebreakerText)
          .single();

        if (existing) {
          await supabase
            .from('icebreaker_analytics')
            .update({ was_used: true })
            .eq('id', existing.id);
        } else {
          // Insert if not tracked before
          await supabase.from('icebreaker_analytics').insert({
            match_id: matchId,
            user_id: user.id,
            icebreaker_text: icebreakerText,
            was_used: true,
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to track icebreaker used:', error);
      }
    },
    [user]
  );

  /**
   * Track when match responds to an icebreaker
   * Call this when detecting a response within 24h
   */
  const trackIcebreakerResponse = useCallback(
    async (matchId: string, responseTimeSeconds: number): Promise<void> => {
      if (!user) return;

      try {
        // Find the most recent used icebreaker for this match
        const { data: analytics } = await supabase
          .from('icebreaker_analytics')
          .select('id')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .eq('was_used', true)
          .is('led_to_response', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analytics) {
          await supabase
            .from('icebreaker_analytics')
            .update({
              led_to_response: true,
              response_time_seconds: responseTimeSeconds,
            })
            .eq('id', analytics.id);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to track icebreaker response:', error);
      }
    },
    [user]
  );

  /**
   * Track multiple icebreakers shown at once (batch)
   */
  const trackIcebreakersShown = useCallback(
    async (
      matchId: string,
      icebreakers: string[],
      category: IcebreakerCategory | null = null
    ): Promise<void> => {
      if (!user || icebreakers.length === 0) return;

      try {
        const records = icebreakers.map((text) => ({
          match_id: matchId,
          user_id: user.id,
          icebreaker_text: text,
          category,
          was_used: false,
        }));

        await supabase.from('icebreaker_analytics').insert(records);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Failed to track icebreakers shown:', error);
      }
    },
    [user]
  );

  return {
    trackIcebreakerShown,
    trackIcebreakerUsed,
    trackIcebreakerResponse,
    trackIcebreakersShown,
  };
}
