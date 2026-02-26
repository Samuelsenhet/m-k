import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { getProfilesAuthKey } from "@/lib/profiles";
import type { TFunction } from "i18next";

type Match = {
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
  /** Common interests (from API) for display on match card */
  interests: string[];
  matchType: "similar" | "complementary";
  matchScore: number;
  status: "pending" | "liked" | "passed" | "mutual";
  compatibilityFactors: string[];
  expiresAt: string;
  /** AI explanation for why this match is likhet/motsatt – shown as comment on matching */
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

import type { MatchDailyMatch } from "@/types/api";
const mapMatch = (m: MatchDailyMatch): Match => ({
  id: m.match_id,
  matchedUser: {
    userId: m.profile_id,
    displayName: m.display_name,
    avatarUrl: m.avatar_url,
    category: m.category ?? undefined,
    archetype: m.archetype ?? undefined,
    bio: m.bio_preview,
    photos: m.photo_urls || [],
  },
  interests: m.common_interests ?? [],
  matchType: m.match_reason?.includes("liknande") ? "similar" : "complementary",
  matchScore: m.compatibility_percentage,
  status: "pending",
  compatibilityFactors: [],
  expiresAt: m.expires_at,
  personalityInsight: m.personality_insight ?? null,
  special_effects: m.special_effects,
  special_event_message: m.special_event_message,
});

export function useMatches() {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const fetchingRef = useRef(false);

  const fetchMatches = useCallback(async () => {
    if (!userId || authLoading || fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);
    setMatches([]);
    setNextCursor(null);
    setHasMore(true);

    let { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token;
    // Validate the JWT server-side before calling the edge function.
    // This guards against stale localStorage sessions with expired tokens.
    const { data: { user: validatedUser } } = await supabase.auth.getUser();
    if (!validatedUser) {
      setError(t("matches.must_be_logged_in"));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    if (import.meta.env.DEV) {
      console.debug("[match-daily] session source: getSession()", {
        hasSession: !!session,
        hasToken: !!token,
        tokenLength: token?.length ?? 0,
      });
    }
    if (!token) {
      await new Promise((r) => setTimeout(r, 400));
      const refetched = await supabase.auth.getSession();
      session = refetched.data.session;
      token = session?.access_token;
      if (import.meta.env.DEV) {
        console.debug("[match-daily] after 400ms retry:", { hasToken: !!token });
      }
    }
    if (!token) {
      if (import.meta.env.DEV) {
        console.warn("[match-daily] No access_token – request would get 401. Ensure supabase.auth.getSession() resolves with a logged-in user before invoking match-daily.");
      }
      setError(t("matches.must_be_logged_in"));
      setLoading(false);
      fetchingRef.current = false;
      return;
    }

    const authHeader = `Bearer ${token}`;
    if (import.meta.env.DEV) {
      console.debug("[match-daily] Authorization header: yes", { tokenLength: token?.length ?? 0 });
    }

    const invokeMatchDaily = async (accessToken: string) => {
      const result = await supabase.functions.invoke("match-daily", {
        body: { user_id: userId, page_size: PAGE_SIZE },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return result;
    };

    try {
      let result = await invokeMatchDaily(token);
      if (result.error) {
        // Retry once after refresh (helps 401) and short delay (helps 429)
        await new Promise((r) => setTimeout(r, 1000));
        const { data: { session: refreshed } } = await supabase.auth.refreshSession();
        const retryToken = refreshed?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token;
        if (retryToken) result = await invokeMatchDaily(retryToken);
      }
      const { data, error } = result;
      // 202 + journey_phase WAITING: success response, no matches yet
      if (data && (data as { journey_phase?: string }).journey_phase === 'WAITING') {
        setMatches([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      if (error) throw error;
      if (!data || !Array.isArray(data.matches)) {
        setMatches([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      setMatches((data.matches as MatchDailyMatch[]).map(mapMatch));
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.debug("[match-daily] Error (safe fallback):", err);
      }
      const errObj = typeof err === "object" && err !== null ? (err as { status?: number; message?: string }) : null;
      const is401 =
        errObj &&
        (errObj.status === 401 || (typeof errObj.message === "string" && /401|unauthorized|jwt|token/i.test(errObj.message)));
      const msg = is401
        ? (import.meta.env.DEV
          ? "401: Token ogiltig. Kontrollera .env = samma projekt som Supabase, och Edge Functions → Secrets (SUPABASE_URL, SUPABASE_ANON_KEY). Se docs/LAUNCH_401_CHECKLIST.md"
          : t("matches.auth_verify_failed"))
        : getErrorMessage(err, t, "matches.loading_error_check_login");
      setError(msg);
      setMatches([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
    // Intentionally omit `t` from deps for stable callback (old pattern; avoid refetch on language change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  // Fetch more matches using cursor
  const fetchMoreMatches = useCallback(async () => {
    if (!user || !nextCursor || !hasMore) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (import.meta.env.DEV && !token) {
      console.warn("[match-daily] fetchMoreMatches: no access_token, skipping invoke.");
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const {
        data,
        error,
      }: {
        data: {
          matches: MatchDailyMatch[];
          next_cursor?: string | null;
        } | null;
        error: unknown;
      } = await supabase.functions.invoke("match-daily", {
        body: {
          user_id: user.id,
          page_size: PAGE_SIZE,
          cursor: nextCursor,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      if (!data || !Array.isArray(data.matches)) {
        setHasMore(false);
        setLoading(false);
        return;
      }
      setMatches((prev) => [
        ...prev,
        ...(data.matches as MatchDailyMatch[]).map(mapMatch),
      ]);
      setNextCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error("Error fetching more matches:", err);
      }
      setError(getErrorMessage(err, t, "matches.load_more_error"));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user, nextCursor, hasMore, t]);

  const generateIcebreakers = async (
    matchId: string,
    userArchetype: string | undefined,
    matchedUserArchetype: string | undefined,
    userName: string,
    matchedUserName: string
  ) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { error } = await supabase.functions.invoke(
        "generate-icebreakers",
        {
          body: {
            matchId,
            userArchetype: userArchetype ?? null,
            matchedUserArchetype: matchedUserArchetype ?? null,
            userName,
            matchedUserName,
          },
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error generating icebreakers:", error);
        }
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error("Failed to generate icebreakers:", err);
      }
    }
  };

  const likeMatch = async (matchId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update({ status: "liked" })
        .eq("id", matchId);

      if (updateError) throw updateError;

      // Check if the other user also liked us
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        const { data: reverseMatch, error: reverseError } = await supabase
          .from("matches")
          .select("*")
          .eq("user_id", match.matchedUser.userId)
          .eq("matched_user_id", user?.id)
          .eq("status", "liked")
          .maybeSingle();

        if (reverseError) throw reverseError;

        if (reverseMatch) {
          // It's a mutual match!
          await supabase
            .from("matches")
            .update({ status: "mutual" })
            .eq("id", matchId);
          await supabase
            .from("matches")
            .update({ status: "mutual" })
            .eq("id", reverseMatch.id);

          // Get user's display name for icebreaker generation
          const userId = user?.id;
          if (!userId) return;
          const profileKey = await getProfilesAuthKey(userId);
          const { data: userProfileResult, error: profileError } =
            await supabase
              .from("profiles")
              .select("display_name")
              .eq(profileKey, userId)
              .single();
          if (profileError && import.meta.env.DEV) {
            console.error("Profile fetch failed", profileError);
          }

          // Use dynamic archetype fallback
          generateIcebreakers(
            matchId,
            match.matchedUser.archetype ?? undefined,
            match.matchedUser.archetype ?? undefined,
            userProfileResult?.display_name || "Användare",
            match.matchedUser.displayName
          );

          setMatches((prev) =>
            prev.map((m) => (m.id === matchId ? { ...m, status: "mutual" } : m))
          );
          return;
        }
      }

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "liked" } : m))
      );
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("Error liking match:", err);
    }
  };

  const passMatch = async (matchId: string) => {
    try {
      const { error: updateError } = await supabase
        .from("matches")
        .update({ status: "passed" })
        .eq("id", matchId);

      if (updateError) throw updateError;

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "passed" } : m))
      );
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error("Error passing match:", err);
      }
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    refreshMatches: fetchMatches,
    fetchMoreMatches,
    hasMore,
    likeMatch,
    passMatch,
  };
}
