import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export interface UserSubscription {
  isPlus: boolean;
  subscriptionTier: 'free' | 'plus' | 'premium';
  validUntil: Date | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>({
    isPlus: false,
    subscriptionTier: 'free',
    validUntil: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Check if subscription is still valid
        const isStillValid = !data.valid_until || new Date(data.valid_until) > new Date();

        setSubscription({
          isPlus: data.is_plus && isStillValid,
          subscriptionTier: (data.subscription_tier as 'free' | 'plus' | 'premium') || 'free',
          validUntil: data.valid_until ? new Date(data.valid_until) : null
        });
      } else {
        // Create default subscription if not exists
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            is_plus: false,
            subscription_tier: 'free'
          });

        if (insertError) throw insertError;

        setSubscription({
          isPlus: false,
          subscriptionTier: 'free',
          validUntil: null
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Daily match limit based on subscription tier
  const getDailyMatchLimit = (): number | null => {
    if (subscription.isPlus) return null; // Unlimited for Plus
    return 5; // Free tier cap
  };

  return {
    ...subscription,
    loading,
    error,
    dailyMatchLimit: getDailyMatchLimit(),
    refreshSubscription: fetchSubscription
  };
};
