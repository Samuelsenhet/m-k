import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/config/supabase";

export interface CollectionMessage {
  id: string;
  collection_id: string;
  sender_id: string | null;
  type: "text" | "system" | "ai";
  content: string;
  created_at: string;
}

export function useCollectionMessages(collectionId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CollectionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!collectionId || !isSupabaseConfigured) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("collection_messages")
        .select("id, collection_id, sender_id, type, content, created_at")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      setMessages((data ?? []) as CollectionMessage[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte hämta meddelanden");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!collectionId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`collection_messages:${collectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "collection_messages",
          filter: `collection_id=eq.${collectionId}`,
        },
        (payload) => {
          const newMsg = payload.new as CollectionMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "collection_messages",
          filter: `collection_id=eq.${collectionId}`,
        },
        (payload) => {
          const updated = payload.new as CollectionMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [collectionId]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!user || !collectionId || !content.trim() || !isSupabaseConfigured)
        return false;
      setSending(true);
      setError(null);
      try {
        const { error: insertError } = await supabase
          .from("collection_messages")
          .insert({
            collection_id: collectionId,
            sender_id: user.id,
            type: "text",
            content: content.trim(),
          });
        if (insertError) throw insertError;
        // Analytics: fire samling_message_sent here when provider is added (see docs/SAMLINGAR_ANALYTICS.md)
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunde inte skicka meddelande");
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, collectionId]
  );

  return { messages, loading, sending, error, sendMessage, refetch: fetchMessages };
}
