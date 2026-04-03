import { useSupabase } from "@/contexts/SupabaseProvider";
import { useCallback, useEffect, useState } from "react";

export type ProfileViewItem = {
  id: string;
  viewer_id: string;
  viewed_user_id: string;
  created_at: string;
  viewer_display_name: string | null;
  viewer_avatar_url: string | null;
  notification_type: "profile_view";
};

export type InterestItem = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  created_at: string;
  sender_display_name: string | null;
  sender_avatar_url: string | null;
  notification_type: "new_interest";
};

export function useNotificationFeedRN() {
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const [profileViews, setProfileViews] = useState<ProfileViewItem[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [viewsRes, interestsRes] = await Promise.all([
        supabase
          .from("profile_views")
          .select("id, viewer_id, viewed_user_id, created_at")
          .eq("viewed_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("matches")
          .select("id, user_id, matched_user_id, status, created_at")
          .eq("matched_user_id", user.id)
          .eq("status", "liked")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (viewsRes.error) throw viewsRes.error;
      if (interestsRes.error) throw interestsRes.error;

      const viewerIds = [...new Set((viewsRes.data ?? []).map((r) => r.viewer_id))];
      const likerIds = [...new Set((interestsRes.data ?? []).map((r) => r.user_id))];
      const allIds = [...new Set([...viewerIds, ...likerIds])];
      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> =
        {};
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", allIds);
        for (const p of profiles ?? []) {
          profileMap[p.id] = {
            display_name: p.display_name ?? null,
            avatar_url: (p as { avatar_url?: string | null }).avatar_url ?? null,
          };
        }
      }

      const viewsList: ProfileViewItem[] = (viewsRes.data ?? []).map((row) => {
        const prof = profileMap[row.viewer_id];
        return {
          id: row.id,
          viewer_id: row.viewer_id,
          viewed_user_id: row.viewed_user_id,
          created_at: row.created_at,
          viewer_display_name: prof?.display_name ?? null,
          viewer_avatar_url: prof?.avatar_url ?? null,
          notification_type: "profile_view",
        };
      });

      const interestsList: InterestItem[] = (interestsRes.data ?? []).map((row) => {
        const prof = profileMap[row.user_id];
        return {
          id: row.id,
          user_id: row.user_id,
          matched_user_id: row.matched_user_id,
          status: row.status,
          created_at: row.created_at,
          sender_display_name: prof?.display_name ?? null,
          sender_avatar_url: prof?.avatar_url ?? null,
          notification_type: "new_interest",
        };
      });

      setProfileViews(viewsList);
      setInterests(interestsList);
    } catch (e) {
      if (__DEV__) console.warn("[useNotificationFeedRN]", e);
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  const acceptInterest = useCallback(
    async (matchId: string) => {
      if (!user) return;
      try {
        const { data: row, error: fetchErr } = await supabase
          .from("matches")
          .select("user_id, matched_user_id")
          .eq("id", matchId)
          .single();
        if (fetchErr || !row) return;

        await supabase.from("matches").update({ status: "mutual" }).eq("id", matchId);

        const reverse = await supabase
          .from("matches")
          .select("id")
          .eq("user_id", row.matched_user_id)
          .eq("matched_user_id", row.user_id)
          .maybeSingle();
        if (reverse.data?.id) {
          await supabase.from("matches").update({ status: "mutual" }).eq("id", reverse.data.id);
        }

        setInterests((prev) => prev.filter((i) => i.id !== matchId));
      } catch (e) {
        if (__DEV__) console.warn("[acceptInterest]", e);
      }
    },
    [supabase, user],
  );

  const rejectInterest = useCallback(
    async (matchId: string) => {
      try {
        await supabase.from("matches").update({ status: "passed" }).eq("id", matchId);
        setInterests((prev) => prev.filter((i) => i.id !== matchId));
      } catch (e) {
        if (__DEV__) console.warn("[rejectInterest]", e);
      }
    },
    [supabase],
  );

  return {
    profileViews,
    interests,
    loading,
    error,
    refresh: fetchFeed,
    acceptInterest,
    rejectInterest,
  };
}
