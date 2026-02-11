import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import { isSupabaseConfigured } from "@/config/supabase";

export type CollectionMemberRole = "owner" | "member";

export interface CollectionMemberWithProfile {
  id: string;
  user_id: string;
  role: CollectionMemberRole;
  joined_at: string;
  left_at: string | null;
  display_name: string;
  avatar_url: string | null;
}

export function useCollectionMembers(collectionId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<CollectionMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!collectionId || !user || !isSupabaseConfigured) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: membersError } = await supabase
        .from("collection_members")
        .select("id, user_id, role, joined_at, left_at")
        .eq("collection_id", collectionId)
        .is("left_at", null);

      if (membersError) throw membersError;
      if (!rows?.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = (rows as { user_id: string }[]).map((r) => r.user_id);
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
      (profilesData ?? []).forEach((p: Record<string, unknown>) => {
        const id = String(p[profileKey] ?? "");
        profileMap.set(id, {
          display_name: String(p.display_name ?? "Användare"),
          avatar_url: (p.avatar_url as string | null) ?? null,
        });
      });

      const withProfiles: CollectionMemberWithProfile[] = (rows as {
        id: string;
        user_id: string;
        role: CollectionMemberRole;
        joined_at: string;
        left_at: string | null;
      }[]).map((r) => {
        const profile = profileMap.get(r.user_id) ?? {
          display_name: "Användare",
          avatar_url: null,
        };
        return {
          ...r,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        };
      });

      setMembers(withProfiles);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta medlemmar");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [collectionId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, loading, error, refetch: fetchMembers };
}
