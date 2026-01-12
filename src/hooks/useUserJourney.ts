import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

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

const determineJourneyPhase = ({
  isOnboardingComplete,
  firstDeliveryDate,
  nextAvailableDate,
  isFirstDay,
}: {
  isOnboardingComplete: boolean;
  firstDeliveryDate: string | null;
  nextAvailableDate: string | null;
  isFirstDay: boolean;
}): JourneyPhase => {
  if (!isOnboardingComplete) {
    return 'ONBOARDING';
  }

  if (!firstDeliveryDate) {
    return isFirstDay ? 'WAITING' : 'READY';
  }

  if (nextAvailableDate) {
    const nextDate = new Date(nextAvailableDate);
    if (nextDate > new Date()) {
      return 'READY';
    }
  }

  return 'ACTIVE';
};

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
      // Check profile for onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, created_at')
        .eq('id', user.id)
        .maybeSingle();

      const isOnboardingComplete = profile?.onboarding_completed ?? false;

      // Check for match delivery status
      const { data: deliveryStatus } = await supabase
        .from('user_match_delivery_status')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const firstDelivered = deliveryStatus?.last_delivered_date ?? null;
      const isFirstDay = !firstDelivered;

      const { count: matchesCount, error: matchesError } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (matchesError) {
        throw matchesError;
      }

      const journeyPhase = determineJourneyPhase({
        isOnboardingComplete,
        firstDeliveryDate: firstDelivered,
        nextAvailableDate: deliveryStatus?.next_available_date ?? null,
        isFirstDay,
      });

      setJourneyState({
        journeyPhase,
        registrationCompletedAt: profile?.created_at ? new Date(profile.created_at) : null,
        firstMatchesDeliveredAt: firstDelivered ? new Date(firstDelivered) : null,
        totalMatchesReceived: matchesCount ?? 0,
        timeUntilNextReset: calculateTimeUntilReset(),
        isFirstDay,
      });
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
      // Update onboarding_completed in profiles if transitioning to ACTIVE
      if (newPhase === 'ACTIVE') {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      setJourneyState(prev => ({
        ...prev,
        journeyPhase: newPhase
      }));
    } catch (err) {
      console.error('Error updating journey phase:', err);
    }
  };

  const incrementMatchesReceived = async (_count: number) => {
    if (!user?.id) return;

    try {
      const now = new Date();
      const todayIso = now.toISOString();

      const { error } = await supabase
        .from('user_match_delivery_status')
        .upsert(
          {
            user_id: user.id,
            last_delivered_date: todayIso,
            updated_at: todayIso,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        throw error;
      }

      await fetchJourneyState();
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
