import { useSupabase } from "@/contexts/SupabaseProvider";
import { isSupabaseInvokeUnauthorized } from "@maak/core";
import type { MatchDailyMatch } from "@/types/api";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type Match = {
  id: string;
  matchedUser: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    category: string;
    archetype?: string;
    bio?: string;
    photos?: string[];
  };
  interests: string[];
  matchType: "similar" | "complementary";
  matchScore: number;
  status: "pending_intro" | "active_chat" | "expired_no_intro";
  compatibilityFactors: string[];
  expiresAt: string;
  personalityInsight?: string | null;
  special_effects?: string[] | null;
  special_event_message?: string | null;
};

const getErrorMessage = (error: unknown, t: TFunction, fallbackKey: string): string => {
  const isNetworkError = (msg: string) =>
    msg === "Failed to fetch" || /network|internet|load/i.test(msg);
  const isEdgeFunctionError = (msg: string) =>
    /non-2xx|Edge Function|status code|FunctionsHttpError/i.test(msg);
  const getMessage = (message: string): string => {
    if (isNetworkError(message)) return t("matches.network_error");
    if (isEdgeFunctionError(message)) return t("matches.server_error");
    return message;
  };
  if (error instanceof Error) {
    return getMessage(error.message) || t(fallbackKey);
  }
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.length > 0) {
      return getMessage(message);
    }
  }
  return t(fallbackKey);
};

const mapMatch = (m: MatchDailyMatch): Match => ({
  id: m.match_id,
  matchedUser: {
    userId: m.profile_id,
    displayName: m.display_name,
    avatarUrl: m.avatar_url,
    category: m.category ?? "",
    archetype: m.archetype ?? undefined,
    bio: m.bio_preview,
    photos: m.photo_urls || [],
  },
  interests: m.common_interests ?? [],
  matchType: m.match_reason?.includes("liknande") ? "similar" : "complementary",
  matchScore: m.compatibility_percentage,
  status:
    m.status === "mutual"
      ? "active_chat"
      : m.status === "passed" || m.status === "disliked"
        ? "expired_no_intro"
        : "pending_intro",
  compatibilityFactors: [],
  expiresAt: m.expires_at,
  personalityInsight: m.personality_insight ?? null,
  special_effects: m.special_effects,
  special_event_message: m.special_event_message,
});

export function useMatches(authLoading: boolean) {
  const { t } = useTranslation();
  const { supabase, session } = useSupabase();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<unknown>(null);
  const [authSessionMissing, setAuthSessionMissing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const userId = session?.user?.id;
  const fetchingRef = useRef(false);

  const fetchMatches = useCallback(async () => {
    if (!userId || authLoading || fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);
    setErrorDetail(null);
    setMatches([]);
    setNextCursor(null);
    setHasMore(true);
    setAuthSessionMissing(false);

    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!s?.access_token) {
        setAuthSessionMissing(true);
        setError(t("matches.must_be_logged_in"));
        return;
      }

      const invokeMatchDaily = (accessToken: string) =>
        supabase.functions.invoke("match-daily", {
          body: { user_id: userId, page_size: PAGE_SIZE },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      let { data, error: fnError } = await invokeMatchDaily(s.access_token);

      if (fnError && !isSupabaseInvokeUnauthorized(fnError)) {
        const {
          data: { session: refreshed },
        } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) {
          ({ data, error: fnError } = await invokeMatchDaily(refreshed.access_token));
        }
      }

      if (fnError) {
        if (__DEV__ && isSupabaseInvokeUnauthorized(fnError)) {
          console.warn(
            "[match-daily] 401 – Edge Function rejected auth. See docs/LAUNCH_401_CHECKLIST.md. Run: supabase link --project-ref <ref> then npm run edge:fix-401",
          );
        }
        throw fnError;
      }

      if (data && (data as { journey_phase?: string }).journey_phase === "WAITING") {
        setMatches([]);
        setHasMore(false);
        return;
      }

      if (!data || !Array.isArray((data as { matches?: unknown }).matches)) {
        setMatches([]);
        setHasMore(false);
        return;
      }

      const payload = data as { matches: MatchDailyMatch[]; next_cursor?: string | null };
      setMatches(payload.matches.map(mapMatch));
      setNextCursor(payload.next_cursor || null);
      setHasMore(!!payload.next_cursor);
    } catch (err: unknown) {
      if (__DEV__) console.debug("[match-daily] error:", err);
      setErrorDetail(err);
      setError(getErrorMessage(err, t, "matches.loading_error_check_login"));
      setMatches([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable t semantics like web
  }, [userId, authLoading, supabase, t]);

  const fetchMoreMatches = useCallback(async () => {
    if (!session?.user || !nextCursor || !hasMore) return;
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    const token = s?.access_token;
    if (!token) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("match-daily", {
        body: {
          user_id: session.user.id,
          page_size: PAGE_SIZE,
          cursor: nextCursor,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnError) throw fnError;
      if (!data || !Array.isArray((data as { matches?: unknown }).matches)) {
        setHasMore(false);
        return;
      }
      const payload = data as { matches: MatchDailyMatch[]; next_cursor?: string | null };
      setMatches((prev) => [...prev, ...payload.matches.map(mapMatch)]);
      setNextCursor(payload.next_cursor || null);
      setHasMore(!!payload.next_cursor);
    } catch (err: unknown) {
      if (__DEV__) console.error("fetchMoreMatches:", err);
      setErrorDetail(err);
      setError(getErrorMessage(err, t, "matches.load_more_error"));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [session?.user, nextCursor, hasMore, supabase, t]);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    setMatches,
    loading,
    error,
    errorDetail,
    authSessionMissing,
    refreshMatches: fetchMatches,
    fetchMoreMatches,
    hasMore,
  };
}
