import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { getProfilesAuthKey } from '@/lib/profiles';

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
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, created_at')
        .eq(profileKey, user.id)
        .maybeSingle();

      const isOnboardingComplete = profile?.onboarding_completed ?? false;

      // Read journey state from user_journey_state (current schema)
      const { data: journey } = await supabase
        .from('user_journey_state')
        .select('journey_phase, registration_completed_at, first_matches_delivered_at, total_matches_received')
        .eq('user_id', user.id)
        .maybeSingle();

      const firstDelivered = journey?.first_matches_delivered_at ?? null;
      const isFirstDay = !firstDelivered;

      const matchesCount = journey?.total_matches_received ?? 0;

      const journeyPhase = determineJourneyPhase({
        isOnboardingComplete,
        firstDeliveryDate: firstDelivered,
        nextAvailableDate: null,
        isFirstDay,
      });

      setJourneyState({
        journeyPhase,
        registrationCompletedAt: journey?.registration_completed_at
          ? new Date(journey.registration_completed_at)
          : (profile?.created_at ? new Date(profile.created_at) : null),
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
        const profileKey = await getProfilesAuthKey(user.id);
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq(profileKey, user.id);
      }

      // Persist journey phase in user_journey_state (best-effort)
      await supabase
        .from('user_journey_state')
        .upsert(
          {
            user_id: user.id,
            journey_phase: newPhase,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

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

      // Preserve original first_matches_delivered_at if it exists
      const firstDeliveredAt = journeyState.firstMatchesDeliveredAt
        ? journeyState.firstMatchesDeliveredAt.toISOString()
        : todayIso;

      // Use atomic increment via RPC or raw SQL to avoid race conditions
      // For now, we send the delta and let the server handle it atomically
      const { error: rpcError } = await supabase.rpc('increment_matches_received', {
        p_user_id: user.id,
        p_increment: _count,
        p_first_delivered_at: firstDeliveredAt,
      });

      // Fallback to upsert if RPC doesn't exist
      if (rpcError && rpcError.code === 'PGRST202') {
        // RPC not found, use upsert with current state
        await supabase
          .from('user_journey_state')
          .upsert(
            {
              user_id: user.id,
              first_matches_delivered_at: firstDeliveredAt,
              total_matches_received: journeyState.totalMatchesReceived + _count,
              updated_at: todayIso,
            },
            { onConflict: 'user_id' }
          );
      } else if (rpcError) {
        console.error('Error in increment RPC:', rpcError);
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
