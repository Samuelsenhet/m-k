import { useSupabase } from "@/contexts/SupabaseProvider";
import { resolveProfilesAuthKey } from "@maak/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export type GroupMemberDisplay = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export interface SamlingGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  theme_color: string;
  created_at: string;
  members: GroupMemberDisplay[];
}

type ProfileRow = { display_name: string | null; avatar_url: string | null } & Record<string, unknown>;

/** Load one group if the current user is a member (for deep link /group-chat/[id]). */
export async function fetchSamlingGroupById(
  supabase: SupabaseClient,
  authUserId: string,
  groupId: string,
): Promise<SamlingGroup | null> {
  const { data: mem } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", authUserId)
    .maybeSingle();
  if (!mem) return null;

  const { data: g, error: gErr } = await supabase
    .from("groups")
    .select("id, name, description, created_by, theme_color, created_at")
    .eq("id", groupId)
    .maybeSingle();
  if (gErr || !g) return null;

  const { data: allMembers } = await supabase
    .from("group_members")
    .select("group_id, user_id")
    .eq("group_id", groupId);

  const userIds = [...new Set((allMembers ?? []).map((m) => m.user_id))];
  const profileKey = await resolveProfilesAuthKey(supabase, authUserId);
  const { data: profilesData } = await supabase
    .from("profiles")
    .select(`${profileKey}, display_name, avatar_url`)
    .in(profileKey, userIds);

  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  (profilesData as ProfileRow[] | null)?.forEach((p) => {
    const uid = p[profileKey];
    if (typeof uid === "string") {
      profileMap.set(uid, { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null });
    }
  });

  const members: GroupMemberDisplay[] =
    allMembers?.map((m) => {
      const prof = profileMap.get(m.user_id);
      return {
        user_id: m.user_id,
        display_name: prof?.display_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
      };
    }) ?? [];

  return {
    id: g.id,
    name: g.name,
    description: g.description ?? null,
    created_by: g.created_by,
    theme_color: g.theme_color ?? "#f472b6",
    created_at: g.created_at,
    members,
  };
}

export function useGroups() {
  const { supabase, session } = useSupabase();
  const user = session?.user;
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
      const profileKey = await resolveProfilesAuthKey(supabase, user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, userIds);

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      (profilesData as ProfileRow[] | null)?.forEach((p) => {
        const uid = p[profileKey];
        if (typeof uid === "string") {
          profileMap.set(uid, { display_name: p.display_name ?? null, avatar_url: p.avatar_url ?? null });
        }
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

      const result: SamlingGroup[] = groupsData.map((g) => ({
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
      if (__DEV__) console.error("[useGroups]", e);
      setError(e instanceof Error ? e.message : "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    void fetchGroups();
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
      const rows = [
        { group_id: group.id, user_id: user.id, role: "creator" as const },
        ...memberUserIds
          .filter((id) => id !== user.id)
          .map((id) => ({ group_id: group.id, user_id: id, role: "member" as const })),
      ];
      const { error: membersErr } = await supabase.from("group_members").insert(rows);
      if (membersErr) return null;
      await fetchGroups();
      return group.id;
    },
    [user, supabase, fetchGroups],
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!user) return false;
      const { error: delErr } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);
      if (delErr) return false;
      await fetchGroups();
      return true;
    },
    [user, supabase, fetchGroups],
  );

  return { groups, loading, error, refreshGroups: fetchGroups, createGroup, leaveGroup };
}
