import { useSupabase } from "@/contexts/SupabaseProvider";
import { isSupabaseInvokeUnauthorized } from "@maak/core";
import type {
  DimensionBreakdownEntry,
  MatchDailyMatch,
  MatchSubtype,
} from "@/types/api";
import type { TFunction } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type { MatchSubtype } from "@/types/api";

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
  /** Legacy field kept for older callers — equals matchSubtype for new pools. */
  matchType: MatchSubtype;
  matchSubtype: MatchSubtype;
  matchScore: number;
  status: "pending_intro" | "active_chat" | "expired_no_intro";
  compatibilityFactors: string[];
  expiresAt: string;
  personalityInsight?: string | null;
  /** Monster Match v1 LLM-generated story (1–2 sentences). Null for legacy pools. */
  matchStory?: string | null;
  /** Per-dimension explanation strings from the LLM voice. */
  dimensionBreakdown: DimensionBreakdownEntry[];
  /** 3 LLM-generated conversation openers; empty for legacy pools. */
  icebreakers: string[];
  /** True when the LLM was unavailable and a template fallback was used. */
  fallbackUsed: boolean;
  /** LLM's independent compatibility judgement 0–100 (null on legacy/fallback). */
  validationScore?: number | null;
  validationNote?: string | null;
  /** Composite signal breakdown — synthesis fields populated when
   *  MONSTER_MATCH_ENABLED=true server-side and LLM landed real output.
   *  Useful for __DEV__ overlays and v1.1 score-explanation UI. */
  signalBreakdown?: {
    personality: number;
    archetype_pair: number;
    interests: number;
    geo: number;
    complementary_bonus: number;
    embedding_similarity?: number | null;
    llm_judgment?: number | null;
  } | null;
  special_effects?: string[] | null;
  special_event_message?: string | null;
};

/** Normalise an unknown match_subtype value to the strict union. */
function normaliseSubtype(value: unknown, fallback: MatchSubtype): MatchSubtype {
  if (value === "similar" || value === "complementary" || value === "growth") {
    return value;
  }
  return fallback;
}

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

const mapMatch = (m: MatchDailyMatch): Match => {
  // Prefer match_subtype from Monster Match v1 pools; fall back to inferring
  // from the legacy match_reason text when the new field is missing
  // (pools generated before Build 81's deploy).
  const inferredFromReason = m.match_reason?.includes("liknande")
    ? "similar"
    : "complementary";
  const subtype = normaliseSubtype(m.match_subtype, inferredFromReason);

  return {
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
    matchType: subtype,
    matchSubtype: subtype,
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
    matchStory: m.match_story ?? null,
    dimensionBreakdown: m.dimension_score_breakdown ?? [],
    icebreakers: m.ai_icebreakers ?? [],
    fallbackUsed: m.fallback_used ?? false,
    validationScore: m.validation_score ?? null,
    validationNote: m.validation_note ?? null,
    signalBreakdown: m.signal_breakdown ?? null,
    special_effects: m.special_effects,
    special_event_message: m.special_event_message,
  };
};

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
  // True when match-daily returned an empty matches[] with a "pool not yet
  // generated" message — distinct from a real no-matches empty state. Lets
  // the UI show a "preparing matches" screen with a Refresh CTA instead of
  // the generic "Inga matchningar idag" (which is what Apple's reviewer hit
  // on build 75 — "no content loaded after the personality test").
  const [preparing, setPreparing] = useState(false);
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
    setPreparing(false);

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
            "[match-daily] 401 - Edge Function rejected auth. See docs/LAUNCH_401_CHECKLIST.md. Run: supabase link --project-ref <ref> then npm run edge:fix-401",
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

      const payload = data as {
        matches: MatchDailyMatch[];
        next_cursor?: string | null;
        message?: string;
      };

      // Pool row missing for today → edge function returns 200 with empty
      // matches and a "not yet generated" message. Surface it distinctly so
      // the UI can tell the user we're preparing matches rather than showing
      // a generic empty state.
      if (payload.matches.length === 0 && /not yet generated/i.test(payload.message ?? "")) {
        setMatches([]);
        setHasMore(false);
        setPreparing(true);
        return;
      }

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
    const uid = session.user.id;
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    const token = s?.access_token;
    if (!token) return;
    setLoading(true);
    setError(null);
    setErrorDetail(null);
    try {
      const invokeMore = (accessToken: string) =>
        supabase.functions.invoke("match-daily", {
          body: {
            user_id: uid,
            page_size: PAGE_SIZE,
            cursor: nextCursor,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      let { data, error: fnError } = await invokeMore(token);

      if (fnError && !isSupabaseInvokeUnauthorized(fnError)) {
        const {
          data: { session: refreshed },
        } = await supabase.auth.refreshSession();
        if (refreshed?.access_token) {
          ({ data, error: fnError } = await invokeMore(refreshed.access_token));
        }
      }

      if (fnError) {
        if (__DEV__ && isSupabaseInvokeUnauthorized(fnError)) {
          console.warn(
            "[match-daily pagination] 401 - Edge Function rejected auth. See docs/LAUNCH_401_CHECKLIST.md.",
          );
        }
        throw fnError;
      }

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
    preparing,
    refreshMatches: fetchMatches,
    fetchMoreMatches,
    hasMore,
  };
}
