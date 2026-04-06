import { useSupabase } from "@/contexts/SupabaseProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { useCallback, useEffect, useState } from "react";

type SundayMatch = {
  id: string;
  matchedUserId: string;
  displayName: string;
  avatarUrl: string | null;
  photos: string[];
  archetype: string | null;
  bio: string | null;
  hometown: string | null;
  compatibilityScore: number | null;
  createdAt: string;
};

/**
 * Returns this week's un-chatted matches on Sundays (paid users only).
 * On non-Sundays or for free users, returns an empty array.
 */
export function useSundayRematch() {
  const { supabase, session } = useSupabase();
  const { hasSundayRematch } = useSubscription();
  const [matches, setMatches] = useState<SundayMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSunday, setIsSunday] = useState(false);

  const fetch = useCallback(async () => {
    if (!session?.access_token || !hasSundayRematch) {
      setMatches([]);
      setIsSunday(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sunday-rematch", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const body = data as {
        sunday: boolean;
        matches: SundayMatch[];
        requires_subscription?: boolean;
      };
      setIsSunday(body.sunday);
      setMatches(body.sunday ? body.matches : []);
    } catch (err) {
      if (__DEV__) console.error("[useSundayRematch]", err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, session?.access_token, hasSundayRematch]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { sundayMatches: matches, loading, isSunday, refresh: fetch };
}
