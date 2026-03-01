import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

/**
 * Returns total count of unread messages for the current user (messages from others in user's matches).
 * Used by BottomNavV2 for the Chat coral badge.
 */
export function useTotalUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function fetchUnread() {
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
      const matchIds = (matches ?? []).map((m) => m.id);
      if (matchIds.length === 0) {
        if (!cancelled) setCount(0);
        return;
      }
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setCount(unreadCount ?? 0);
    }

    fetchUnread();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return count;
}
