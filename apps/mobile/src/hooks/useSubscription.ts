import { useSupabase } from "@/contexts/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";

/**
 * Pricing tiers (mobile IAP - products configured in App Store Connect + RevenueCat):
 *
 *   free     - core experience: browse matches (5/dag), kemichat (1-on-1), basic filters.
 *              Samlingsgrupp: kan gå med via inbjudan men INTE skapa.
 *              Isbrytare: max 5/dag.
 *   basic    - Basic weekly (69 kr): fler matchningar, söndagsmatchning, skapa
 *              samlingsgrupp, obegränsade isbrytare, avancerade filter.
 *   premium  - Premium monthly (199 kr): allt i Basic + läskvitton i chatten.
 *
 * Match *quantity* is already gated in the match-daily edge function (5 vs unlimited).
 * Source of truth: `subscriptions` table, written only by the RevenueCat webhook.
 * Legacy 'plus'/'vip' rows map to 'basic'/'premium' for forward compat.
 */
export type SubscriptionTier = "free" | "basic" | "premium";

export interface UserSubscription {
  tier: SubscriptionTier;
  hasPaid: boolean;
  isBasic: boolean;
  isPremium: boolean;
  validUntil: Date | null;
}

type SubscriptionRow = {
  plan_type: string;
  status: string;
  expires_at: string | null;
};

function mapSubscription(row: SubscriptionRow | null): UserSubscription {
  if (!row || row.status !== "active") {
    return { tier: "free", hasPaid: false, isBasic: false, isPremium: false, validUntil: null };
  }
  const notExpired = !row.expires_at || new Date(row.expires_at) > new Date();
  if (!notExpired) {
    return {
      tier: "free",
      hasPaid: false,
      isBasic: false,
      isPremium: false,
      validUntil: row.expires_at ? new Date(row.expires_at) : null,
    };
  }
  let tier: SubscriptionTier = "free";
  switch (row.plan_type) {
    case "premium":
    case "vip":
      tier = "premium";
      break;
    case "basic":
    case "plus":
      tier = "basic";
      break;
    default:
      tier = "free";
  }
  return {
    tier,
    hasPaid: tier !== "free",
    isBasic: tier === "basic",
    isPremium: tier === "premium",
    validUntil: row.expires_at ? new Date(row.expires_at) : null,
  };
}

/**
 * Read-only subscription state from `subscriptions` (RLS: SELECT only for own row).
 * Client never writes - RevenueCat webhook is the only writer.
 */
export function useSubscription() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const [subscription, setSubscription] = useState<UserSubscription>({
    tier: "free",
    hasPaid: false,
    isBasic: false,
    isPremium: false,
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
      setError(null);
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

  // ── Feature flags ──────────────────────────────────────────────
  // Samlingsgrupp: free users can JOIN (via invite) but not CREATE.
  const canCreateGroups = subscription.hasPaid;
  // Icebreakers: free = 5/day (enforced server-side), paid = unlimited.
  const hasUnlimitedIcebreakers = subscription.hasPaid;
  // Sunday rematch: paid only.
  const hasSundayRematch = subscription.hasPaid;
  // More matches per day from the algorithm (already in match-daily edge fn).
  const hasMoreMatches = subscription.hasPaid;
  // Advanced matching filters.
  const hasAdvancedFilters = subscription.hasPaid;
  // Read receipts: premium only.
  // Kemi-Check: free = 1/day (enforced server-side), paid = unlimited.
  const hasUnlimitedKemiCheck = subscription.hasPaid;
  const hasReadReceipts = subscription.isPremium;

  return {
    ...subscription,
    loading,
    error,
    canCreateGroups,
    hasUnlimitedIcebreakers,
    hasSundayRematch,
    hasMoreMatches,
    hasAdvancedFilters,
    hasUnlimitedKemiCheck,
    hasReadReceipts,
    refreshSubscription: fetchSubscription,
  };
}
