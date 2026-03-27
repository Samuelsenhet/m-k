import { useSupabase } from "@/contexts/SupabaseProvider";
import { resolveProfilesAuthKey } from "@maak/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type MutualChatRow = {
  id: string;
  matched_user_id: string;
  matched_profile: {
    display_name: string;
    avatar_url: string | null;
    id_verification_status?: string | null;
  };
  last_message?: { content: string; created_at: string };
  unread_count: number;
};

type ProfileLookupRow = {
  display_name: string | null;
  avatar_url: string | null;
  id_verification_status?: string | null;
} & Record<string, unknown>;

export function useMutualChatMatches() {
  const { i18n } = useTranslation();
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const [matches, setMatches] = useState<MutualChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual")
        .order("created_at", { ascending: false });

      if (matchesError) throw matchesError;

      if (!matchesData?.length) {
        setMatches([]);
        return;
      }

      const matchedUserIds = matchesData.map((m) =>
        m.user_id === user.id ? m.matched_user_id : m.user_id,
      );
      const matchIds = matchesData.map((m) => m.id);

      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url, id_verification_status`)
        .in(profileKey, matchedUserIds);

      const { data: lastMessagesData } = await supabase
        .from("messages")
        .select("match_id, content, created_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false });

      const { data: unreadData } = await supabase
        .from("messages")
        .select("match_id")
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      const profileMap = new Map<string, ProfileLookupRow>();
      (profilesData as ProfileLookupRow[] | null | undefined)?.forEach((p) => {
        const keyValue = p?.[profileKey];
        if (typeof keyValue === "string") profileMap.set(keyValue, p);
      });

      const lastMessageMap = new Map<string, { content: string; created_at: string }>();
      lastMessagesData?.forEach((msg) => {
        if (!lastMessageMap.has(msg.match_id)) {
          lastMessageMap.set(msg.match_id, { content: msg.content, created_at: msg.created_at });
        }
      });

      const unreadCountMap = new Map<string, number>();
      unreadData?.forEach((msg) => {
        unreadCountMap.set(msg.match_id, (unreadCountMap.get(msg.match_id) || 0) + 1);
      });

      const combined: MutualChatRow[] = matchesData.map((row) => {
        const matchedUserId = row.user_id === user.id ? row.matched_user_id : row.user_id;
        const profile = profileMap.get(matchedUserId);
        return {
          id: row.id,
          matched_user_id: matchedUserId,
          matched_profile: {
            display_name: profile?.display_name ?? i18n.t("common.user"),
            avatar_url: profile?.avatar_url ?? null,
            id_verification_status:
              typeof profile?.id_verification_status === "string"
                ? profile.id_verification_status
                : null,
          },
          last_message: lastMessageMap.get(row.id),
          unread_count: unreadCountMap.get(row.id) ?? 0,
        };
      });

      setMatches(combined);
    } catch (e) {
      if (__DEV__) console.error("[useMutualChatMatches]", e);
      setError(e instanceof Error ? e.message : "fetch failed");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, i18n.language]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { matches, loading, error, refresh };
}
