import { useSupabase } from "@/contexts/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";

export interface UserSubscription {
  isPlus: boolean;
  subscriptionTier: "free" | "plus" | "premium";
  validUntil: Date | null;
}

type SubscriptionRow = {
  plan_type: string;
  status: string;
  expires_at: string | null;
};

function mapSubscription(row: SubscriptionRow | null): UserSubscription {
  if (!row || row.status !== "active") {
    return {
      isPlus: false,
      subscriptionTier: "free",
      validUntil: null,
    };
  }
  const notExpired = !row.expires_at || new Date(row.expires_at) > new Date();
  const plan = row.plan_type;
  const isPaid = notExpired && (plan === "premium" || plan === "vip");
  let subscriptionTier: "free" | "plus" | "premium" = "free";
  if (isPaid) {
    subscriptionTier = plan === "vip" ? "premium" : "plus";
  }
  return {
    isPlus: isPaid,
    subscriptionTier,
    validUntil: row.expires_at ? new Date(row.expires_at) : null,
  };
}

/**
 * Read-only subscription tier from `subscriptions` (RLS: SELECT only for own row).
 * Aligns with web `src/hooks/useSubscription.ts` — no client writes.
 */
export function useSubscription() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const [subscription, setSubscription] = useState<UserSubscription>({
    isPlus: false,
    subscriptionTier: "free",
    validUntil: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("plan_type, status, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setSubscription(mapSubscription(data as SubscriptionRow | null));
    } catch (err) {
      if (__DEV__) console.error("useSubscription:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch subscription"));
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const getDailyMatchLimit = (): number | null => {
    if (subscription.isPlus) return null;
    return 5;
  };

  return {
    ...subscription,
    loading,
    error,
    dailyMatchLimit: getDailyMatchLimit(),
    refreshSubscription: fetchSubscription,
  };
}
