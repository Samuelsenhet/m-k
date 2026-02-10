import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { getProfilesAuthKey } from "@/lib/profiles";
import type { GroupMemberDisplay } from "@/components/chat/GroupAvatar";

export interface SamlingGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  theme_color: string;
  created_at: string;
  members: GroupMemberDisplay[];
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<SamlingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: myMemberships, error: memErr } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (memErr) {
        setError(memErr.message);
        setGroups([]);
        return;
      }
      if (!myMemberships?.length) {
        setGroups([]);
        return;
      }

      const groupIds = myMemberships.map((m) => m.group_id);
      const { data: groupsData, error: groupsErr } = await supabase
        .from("groups")
        .select("id, name, description, created_by, theme_color, created_at")
        .in("id", groupIds)
        .order("updated_at", { ascending: false });

      if (groupsErr) {
        setError(groupsErr.message);
        setGroups([]);
        return;
      }
      if (!groupsData?.length) {
        setGroups([]);
        return;
      }

      const { data: allMembers } = await supabase
        .from("group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      const userIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, userIds);

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      (profilesData as unknown as Array<{ id?: string; user_id?: string; display_name: string | null; avatar_url: string | null }>)?.forEach((p) => {
        const uid = p.id ?? p.user_id;
        if (uid) profileMap.set(uid, { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null });
      });

      const membersByGroup = new Map<string, GroupMemberDisplay[]>();
      allMembers?.forEach((m) => {
        const prof = profileMap.get(m.user_id);
        const list = membersByGroup.get(m.group_id) ?? [];
        list.push({
          user_id: m.user_id,
          display_name: prof?.display_name ?? null,
          avatar_url: prof?.avatar_url ?? null,
        });
        membersByGroup.set(m.group_id, list);
      });

      const result: SamlingGroup[] = (groupsData ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? null,
        created_by: g.created_by,
        theme_color: g.theme_color ?? "#f472b6",
        created_at: g.created_at,
        members: membersByGroup.get(g.id) ?? [],
      }));
      setGroups(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(
    async (name: string, memberUserIds: string[]) => {
      if (!user) return null;
      const { data: group, error: insertErr } = await supabase
        .from("groups")
        .insert({ name, created_by: user.id })
        .select("id")
        .single();
      if (insertErr || !group) return null;
      const rows = [{ group_id: group.id, user_id: user.id, role: "creator" as const }, ...memberUserIds.filter((id) => id !== user.id).map((id) => ({ group_id: group.id, user_id: id, role: "member" as const }))];
      const { error: membersErr } = await supabase.from("group_members").insert(rows);
      if (membersErr) return null;
      await fetchGroups();
      return group.id;
    },
    [user, fetchGroups]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return false;
      const { error: delErr } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      if (delErr) return false;
      await fetchGroups();
      return true;
    },
    [user, fetchGroups]
  );

  return { groups, loading, error, refreshGroups: fetchGroups, createGroup, leaveGroup };
}
