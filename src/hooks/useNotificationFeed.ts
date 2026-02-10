import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export type ProfileViewItem = {
  id: string;
  viewer_id: string;
  viewed_user_id: string;
  created_at: string;
  viewer_display_name: string | null;
  viewer_avatar_url: string | null;
};

export type InterestItem = {
  id: string;
  user_id: string;
  matched_user_id: string;
  status: string;
  created_at: string;
  liker_display_name: string | null;
  liker_avatar_url: string | null;
};

export function useNotificationFeed() {
  const { user } = useAuth();
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
          .from('profile_views')
          .select('id, viewer_id, viewed_user_id, created_at')
          .eq('viewed_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('matches')
          .select('id, user_id, matched_user_id, status, created_at')
          .eq('matched_user_id', user.id)
          .eq('status', 'liked')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (viewsRes.error) throw viewsRes.error;
      if (interestsRes.error) throw interestsRes.error;

      const viewerIds = [...new Set((viewsRes.data ?? []).map((r: { viewer_id: string }) => r.viewer_id))];
      const likerIds = [...new Set((interestsRes.data ?? []).map((r: { user_id: string }) => r.user_id))];
      const allIds = [...new Set([...viewerIds, ...likerIds])];
      const profileMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', allIds);
        for (const p of profiles ?? []) {
          profileMap[p.id] = { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null };
        }
      }

      const viewsList: ProfileViewItem[] = (viewsRes.data ?? []).map((row: Record<string, unknown>) => {
        const prof = profileMap[row.viewer_id as string];
        return {
          id: row.id as string,
          viewer_id: row.viewer_id as string,
          viewed_user_id: row.viewed_user_id as string,
          created_at: row.created_at as string,
          viewer_display_name: prof?.display_name ?? null,
          viewer_avatar_url: prof?.avatar_url ?? null,
        };
      });

      const interestsList: InterestItem[] = (interestsRes.data ?? []).map((row: Record<string, unknown>) => {
        const prof = profileMap[row.user_id as string];
        return {
          id: row.id as string,
          user_id: row.user_id as string,
          matched_user_id: row.matched_user_id as string,
          status: row.status as string,
          created_at: row.created_at as string,
          liker_display_name: prof?.display_name ?? null,
          liker_avatar_url: prof?.avatar_url ?? null,
        };
      });

      setProfileViews(viewsList);
      setInterests(interestsList);
    } catch (e) {
      if (import.meta.env.DEV) console.error('Notification feed error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const acceptInterest = useCallback(
    async (matchId: string) => {
      if (!user) return;
      try {
        const { data: row, error: fetchErr } = await supabase
          .from('matches')
          .select('user_id, matched_user_id')
          .eq('id', matchId)
          .single();
        if (fetchErr || !row) return;

        await supabase.from('matches').update({ status: 'mutual' }).eq('id', matchId);

        const reverse = await supabase
          .from('matches')
          .select('id')
          .eq('user_id', row.matched_user_id)
          .eq('matched_user_id', row.user_id)
          .maybeSingle();
        if (reverse.data?.id) {
          await supabase.from('matches').update({ status: 'mutual' }).eq('id', reverse.data.id);
        }

        setInterests((prev) => prev.filter((i) => i.id !== matchId));
      } catch (e) {
        if (import.meta.env.DEV) console.error('Accept interest error:', e);
      }
    },
    [user]
  );

  const rejectInterest = useCallback(async (matchId: string) => {
    try {
      await supabase.from('matches').update({ status: 'passed' }).eq('id', matchId);
      setInterests((prev) => prev.filter((i) => i.id !== matchId));
    } catch (e) {
      if (import.meta.env.DEV) console.error('Reject interest error:', e);
    }
  }, []);

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
