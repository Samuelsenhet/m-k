import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/config/supabase";

export type CollectionRole = "owner" | "member";

export interface CollectionMemberRow {
  id: string;
  collection_id: string;
  user_id: string;
  role: CollectionRole;
  joined_at: string;
  left_at: string | null;
}

export interface CollectionRow {
  id: string;
  created_at: string;
  created_by: string;
  name: string;
  avatar_seed: string | null;
  is_active: boolean;
}

export interface CollectionWithMeta {
  id: string;
  name: string;
  avatar_seed: string | null;
  created_at: string;
  member_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
}

export function useCollections() {
  const { user } = useAuth();
  const [list, setList] = useState<CollectionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: memberRows, error: membersError } = await supabase
        .from("collection_members")
        .select("id, collection_id, user_id, role, joined_at, left_at")
        .eq("user_id", user.id)
        .is("left_at", null);

      if (membersError) throw membersError;
      if (!memberRows?.length) {
        setList([]);
        setLoading(false);
        return;
      }

      const collectionIds = [...new Set((memberRows as CollectionMemberRow[]).map((m) => m.collection_id))];

      const { data: collectionsData, error: collError } = await supabase
        .from("collections")
        .select("id, created_at, created_by, name, avatar_seed, is_active")
        .in("id", collectionIds)
        .eq("is_active", true);

      if (collError) throw collError;
      const collections = (collectionsData ?? []) as CollectionRow[];

      const memberCountMap = new Map<string, number>();
      for (const cid of collectionIds) {
        const { count } = await supabase
          .from("collection_members")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", cid)
          .is("left_at", null);
        memberCountMap.set(cid, count ?? 0);
      }

      const lastMessageMap = new Map<string, { content: string; created_at: string }>();
      for (const cid of collectionIds) {
        const { data: msgs } = await supabase
          .from("collection_messages")
          .select("content, created_at")
          .eq("collection_id", cid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (msgs)
          lastMessageMap.set(cid, {
            content: (msgs as { content: string }).content,
            created_at: (msgs as { created_at: string }).created_at,
          });
      }

      const withMeta: CollectionWithMeta[] = collections.map((c) => ({
        id: c.id,
        name: c.name,
        avatar_seed: c.avatar_seed,
        created_at: c.created_at,
        member_count: memberCountMap.get(c.id) ?? 0,
        last_message_preview: lastMessageMap.get(c.id)?.content ?? null,
        last_message_at: lastMessageMap.get(c.id)?.created_at ?? null,
      }));

      withMeta.sort((a, b) => (b.last_message_at ?? b.created_at).localeCompare(a.last_message_at ?? a.created_at));
      setList(withMeta);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kunde inte hämta samlingar";
      setError(msg);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const create = useCallback(
    async (name: string, memberUserIds: string[]): Promise<{ id: string } | null> => {
      if (!user || !isSupabaseConfigured) return null;
      setError(null);
      try {
        const avatar_seed = name + Date.now();
        const { data: coll, error: insertColl } = await supabase
          .from("collections")
          .insert({
            created_by: user.id,
            name,
            avatar_seed,
            is_active: true,
          })
          .select("id")
          .single();

        if (insertColl || !coll) throw insertColl ?? new Error("Kunde inte skapa samling");
        const collectionId = (coll as { id: string }).id;

        await supabase.from("collection_members").insert({
          collection_id: collectionId,
          user_id: user.id,
          role: "owner",
        });

        const otherMembers = memberUserIds.filter((id) => id !== user.id);
        if (otherMembers.length > 0) {
          await supabase.from("collection_members").insert(
            otherMembers.map((uid) => ({
              collection_id: collectionId,
              user_id: uid,
              role: "member" as const,
            }))
          );
        }

        await fetchList();
        // Analytics: fire samling_created here when provider is added (see docs/SAMLINGAR_ANALYTICS.md)
        return { id: collectionId };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kunde inte skapa samling";
        setError(msg);
        return null;
      }
    },
    [user, fetchList]
  );

  const addMember = useCallback(
    async (collectionId: string, userId: string): Promise<boolean> => {
      if (!user || !isSupabaseConfigured) return false;
      setError(null);
      try {
        const { error: err } = await supabase.from("collection_members").insert({
          collection_id: collectionId,
          user_id: userId,
          role: "member",
        });
        if (err) throw err;
        await fetchList();
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kunde inte lägga till medlem";
        setError(msg);
        return false;
      }
    },
    [user, fetchList]
  );

  const leave = useCallback(
    async (collectionId: string): Promise<boolean> => {
      if (!user || !isSupabaseConfigured) return false;
      setError(null);
      try {
        const { error: err } = await supabase
          .from("collection_members")
          .update({ left_at: new Date().toISOString() })
          .eq("collection_id", collectionId)
          .eq("user_id", user.id)
          .is("left_at", null);
        if (err) throw err;
        await fetchList();
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Kunde inte lämna samling";
        setError(msg);
        return false;
      }
    },
    [user, fetchList]
  );

  return { list, loading, error, create, addMember, leave, refetch: fetchList };
}
