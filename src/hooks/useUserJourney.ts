import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type JourneyPhase = 'ONBOARDING' | 'WAITING' | 'READY' | 'ACTIVE';

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface UserJourneyState {
  journeyPhase: JourneyPhase;
  registrationCompletedAt: Date | null;
  firstMatchesDeliveredAt: Date | null;
  totalMatchesReceived: number;
  timeUntilNextReset: TimeRemaining;
  isFirstDay: boolean;
}

const RESET_HOUR = 0; // 00:00 CET
const TIMEZONE = 'Europe/Stockholm';

const calculateTimeUntilReset = (): TimeRemaining => {
  const now = new Date();
  
  // Get current time in CET
  const cetTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  // Calculate next midnight CET
  const tomorrow = new Date(cetTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(RESET_HOUR, 0, 0, 0);
  
  const msRemaining = tomorrow.getTime() - cetTime.getTime();
  
  return {
    hours: Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60))),
    minutes: Math.max(0, Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60))),
    seconds: Math.max(0, Math.floor((msRemaining % (1000 * 60)) / 1000))
  };
};

export const useUserJourney = () => {
  const { user } = useAuth();
  const [journeyState, setJourneyState] = useState<UserJourneyState>({
    journeyPhase: 'ONBOARDING',
    registrationCompletedAt: null,
    firstMatchesDeliveredAt: null,
    totalMatchesReceived: 0,
    timeUntilNextReset: { hours: 0, minutes: 0, seconds: 0 },
    isFirstDay: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchJourneyState = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Check if journey state exists
      const { data: existingState, error: fetchError } = await supabase
        .from('user_journey_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Check profile for onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      const isOnboardingComplete = profile?.onboarding_completed ?? false;

      if (!existingState) {
        // Create initial journey state
        const { data: newState, error: insertError } = await supabase
          .from('user_journey_state')
          .insert({
            user_id: user.id,
            journey_phase: isOnboardingComplete ? 'ACTIVE' : 'ONBOARDING',
            registration_completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setJourneyState({
          journeyPhase: (newState?.journey_phase as JourneyPhase) || 'ONBOARDING',
          registrationCompletedAt: newState?.registration_completed_at 
            ? new Date(newState.registration_completed_at) 
            : null,
          firstMatchesDeliveredAt: null,
          totalMatchesReceived: 0,
          timeUntilNextReset: calculateTimeUntilReset(),
          isFirstDay: true
        });
      } else {
        // Determine correct phase based on current state
        let phase: JourneyPhase = existingState.journey_phase as JourneyPhase;
        
        // If still marked as onboarding but onboarding is complete, update
        if (phase === 'ONBOARDING' && isOnboardingComplete) {
          phase = 'ACTIVE';
          await supabase
            .from('user_journey_state')
            .update({ journey_phase: 'ACTIVE', updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }

        const isFirstDay = !existingState.first_matches_delivered_at;

        setJourneyState({
          journeyPhase: phase,
          registrationCompletedAt: existingState.registration_completed_at 
            ? new Date(existingState.registration_completed_at) 
            : null,
          firstMatchesDeliveredAt: existingState.first_matches_delivered_at 
            ? new Date(existingState.first_matches_delivered_at) 
            : null,
          totalMatchesReceived: existingState.total_matches_received || 0,
          timeUntilNextReset: calculateTimeUntilReset(),
          isFirstDay
        });
      }
    } catch (err) {
      console.error('Error fetching journey state:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch journey state'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setJourneyState(prev => ({
        ...prev,
        timeUntilNextReset: calculateTimeUntilReset()
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch journey state on mount and user change
  useEffect(() => {
    fetchJourneyState();
  }, [fetchJourneyState]);

  const updateJourneyPhase = async (newPhase: JourneyPhase) => {
    if (!user?.id) return;

    try {
      const updates: Record<string, unknown> = {
        journey_phase: newPhase,
        updated_at: new Date().toISOString()
      };

      // If transitioning to ACTIVE after first matches, record the timestamp
      if (newPhase === 'ACTIVE' && journeyState.isFirstDay) {
        updates.first_matches_delivered_at = new Date().toISOString();
      }

      await supabase
        .from('user_journey_state')
        .update(updates)
        .eq('user_id', user.id);

      setJourneyState(prev => ({
        ...prev,
        journeyPhase: newPhase,
        firstMatchesDeliveredAt: newPhase === 'ACTIVE' && prev.isFirstDay 
          ? new Date() 
          : prev.firstMatchesDeliveredAt,
        isFirstDay: newPhase === 'ACTIVE' ? false : prev.isFirstDay
      }));
    } catch (err) {
      console.error('Error updating journey phase:', err);
    }
  };

  const incrementMatchesReceived = async (count: number) => {
    if (!user?.id) return;

    const newTotal = journeyState.totalMatchesReceived + count;

    try {
      await supabase
        .from('user_journey_state')
        .update({
          total_matches_received: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setJourneyState(prev => ({
        ...prev,
        totalMatchesReceived: newTotal
      }));
    } catch (err) {
      console.error('Error incrementing matches received:', err);
    }
  };

  return {
    ...journeyState,
    loading,
    error,
    updateJourneyPhase,
    incrementMatchesReceived,
    refreshJourneyState: fetchJourneyState
  };
};
