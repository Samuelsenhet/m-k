import { useSupabase } from "@/contexts/SupabaseProvider";
import { isSupabaseInvokeUnauthorized } from "@maak/core";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MatchStatus {
  journey_phase: "WAITING" | "READY" | "FIRST_MATCH";
  time_remaining: string;
  delivered_today: number;
  next_reset_time: string;
}

export function useMatchStatus(authLoading: boolean) {
  const { supabase, session } = useSupabase();
  const [status, setStatus] = useState<MatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorDetail, setErrorDetail] = useState<unknown>(null);
  const userId = session?.user?.id;
  const fetchingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!userId || authLoading || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);
      setErrorDetail(null);

      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!s?.access_token) {
        setError(new Error("Not authenticated"));
        setErrorDetail(null);
        return;
      }

      const invokeStatus = (accessToken: string) =>
        supabase.functions.invoke("match-status", {
          body: { user_id: userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      let { data, error: fnError } = await invokeStatus(s.access_token);

      if (fnError && !isSupabaseInvokeUnauthorized(fnError)) {
        const {
          data: { session: refreshed },
        } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) {
          ({ data, error: fnError } = await invokeStatus(refreshed.access_token));
        }
      }

      if (fnError) {
        setErrorDetail(fnError);
        if (__DEV__ && isSupabaseInvokeUnauthorized(fnError)) {
          console.warn(
            "[match-status] 401 – Edge Function rejected auth. See docs/LAUNCH_401_CHECKLIST.md. Run: supabase link --project-ref <ref> then npm run edge:fix-401",
          );
        }
        throw new Error(
          typeof fnError === "object" && fnError && "message" in fnError
            ? String((fnError as { message?: string }).message)
            : "match-status failed",
        );
      }
      if (data != null) setStatus(data as MatchStatus);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, authLoading, supabase]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    error,
    errorDetail,
    refetch: fetchStatus,
  };
}
