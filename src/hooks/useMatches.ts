import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

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
  matchType: "similar" | "complementary";
  matchScore: number;
  status: "pending" | "liked" | "passed" | "mutual";
  compatibilityFactors: string[];
  expiresAt: string;
  special_effects?: string[] | null;
  special_event_message?: string | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
};

import type { MatchDailyMatch, DimensionScoreBreakdown } from "@/types/api";
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
  matchType: m.match_reason?.includes("liknande") ? "similar" : "complementary",
  matchScore: m.compatibility_percentage,
  status: "pending",
  compatibilityFactors: [],
  expiresAt: m.expires_at,
  special_effects: m.special_effects,
  special_event_message: m.special_event_message,
});

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;
  const { user } = useAuth();

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setMatches([]);
    setNextCursor(null);
    setHasMore(true);

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
        },
      });
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
      console.error("Error fetching matches:", err);
      setError(getErrorMessage(err, "Kunde inte hämta matchningar"));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch more matches using cursor
  const fetchMoreMatches = useCallback(async () => {
    if (!user || !nextCursor || !hasMore) return;
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
      console.error("Error fetching more matches:", err);
      setError(getErrorMessage(err, "Kunde inte hämta fler matchningar"));
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [user, nextCursor, hasMore]);

  const generateIcebreakers = async (
    matchId: string,
    userArchetype: string,
    matchedUserArchetype: string,
    userName: string,
    matchedUserName: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke(
        "generate-icebreakers",
        {
          body: {
            matchId,
            userArchetype,
            matchedUserArchetype,
            userName,
            matchedUserName,
          },
        }
      );

      if (error) {
        console.error("Error generating icebreakers:", error);
      }
    } catch (err: unknown) {
      console.error("Failed to generate icebreakers:", err);
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
          const { data: userProfileResult, error: profileError } =
            await supabase
              .from("profiles")
              .select("display_name, archetype")
              .eq("id", user?.id)
              .single();
          if (profileError) {
            console.error("Profile fetch failed", profileError);
            // Optionally report to Sentry or similar here
          }

          // Use dynamic archetype fallback
          generateIcebreakers(
            matchId,
            userProfileResult?.archetype ??
              match.matchedUser.archetype ??
              undefined,
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
      console.error("Error liking match:", err);
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
      console.error("Error passing match:", err);
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
