import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import { isSupabaseConfigured } from "@/config/supabase";

export interface ProfileViewItem {
  id: string;
  viewer_id: string;
  viewer_display_name: string | null;
  viewer_avatar_url: string | null;
  created_at: string;
}

export interface InterestItem {
  id: string;
  liker_display_name: string | null;
  liker_avatar_url: string | null;
  created_at: string;
}

export function useNotificationFeed() {
  const { user } = useAuth();
  const [profileViews, setProfileViews] = useState<ProfileViewItem[]>([]);
  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProfileViews([]);
      setInterests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const key = await getProfilesAuthKey(user.id);

      // Profile views: who viewed my profile
      const { data: viewsData, error: viewsError } = await supabase
        .from("profile_views")
        .select("id, viewer_id, viewed_user_id, created_at")
        .eq("viewed_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (viewsError) throw viewsError;
      const views = (viewsData ?? []) as {
        id: string;
        viewer_id: string;
        viewed_user_id: string;
        created_at: string;
      }[];

      const viewerIds = [...new Set(views.map((v) => v.viewer_id))];
      const viewerProfiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (viewerIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, " + key)
          .in(key, viewerIds);
        (profData ?? []).forEach((p: Record<string, unknown>) => {
          const id = p[key] as string;
          viewerProfiles[id] = {
            display_name: (p.display_name as string) ?? null,
            avatar_url: (p.avatar_url as string) ?? null,
          };
        });
      }
      setProfileViews(
        views.map((v) => ({
          id: v.id,
          viewer_id: v.viewer_id,
          viewer_display_name: viewerProfiles[v.viewer_id]?.display_name ?? null,
          viewer_avatar_url: viewerProfiles[v.viewer_id]?.avatar_url ?? null,
          created_at: v.created_at,
        }))
      );

      // Interests: matches where someone liked us (matched_user_id = me, status = liked)
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, user_id, matched_user_id, status, created_at")
        .eq("matched_user_id", user.id)
        .eq("status", "liked")
        .order("created_at", { ascending: false })
        .limit(50);

      if (matchesError) throw matchesError;
      const matchRows = (matchesData ?? []) as {
        id: string;
        user_id: string;
        matched_user_id: string;
        status: string;
        created_at: string;
      }[];

      const likerIds = [...new Set(matchRows.map((m) => m.user_id))];
      const likerProfiles: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (likerIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, " + key)
          .in(key, likerIds);
        (profData ?? []).forEach((p: Record<string, unknown>) => {
          const id = p[key] as string;
          likerProfiles[id] = {
            display_name: (p.display_name as string) ?? null,
            avatar_url: (p.avatar_url as string) ?? null,
          };
        });
      }
      setInterests(
        matchRows.map((m) => ({
          id: m.id,
          liker_display_name: likerProfiles[m.user_id]?.display_name ?? null,
          liker_avatar_url: likerProfiles[m.user_id]?.avatar_url ?? null,
          created_at: m.created_at,
        }))
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kunde inte ladda notifieringar";
      setError(msg);
      setProfileViews([]);
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const acceptInterest = useCallback(
    async (matchId: string) => {
      const { error: err } = await supabase
        .from("matches")
        .update({ status: "mutual" })
        .eq("id", matchId)
        .eq("matched_user_id", user?.id);
      if (!err) setInterests((prev) => prev.filter((i) => i.id !== matchId));
    },
    [user?.id]
  );

  const rejectInterest = useCallback(
    async (matchId: string) => {
      const { error: err } = await supabase
        .from("matches")
        .update({ status: "passed" })
        .eq("id", matchId)
        .eq("matched_user_id", user?.id);
      if (!err) setInterests((prev) => prev.filter((i) => i.id !== matchId));
    },
    [user?.id]
  );

  return {
    profileViews,
    interests,
    loading,
    error,
    acceptInterest,
    rejectInterest,
    refetch: load,
  };
}
