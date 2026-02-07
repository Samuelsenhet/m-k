import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";

export interface GroupChatRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_message?: { content: string; created_at: string } | null;
}

export default function GroupChatList() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupChatRow[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const dateLocale = i18n.language === "sv" ? sv : enUS;

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    setLoadingGroups(true);
    try {
      const { data: memberships, error: memError } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", user.id);

      if (memError) {
        console.error("Error fetching group memberships:", memError);
        setGroups([]);
        return;
      }

      if (!memberships?.length) {
        setGroups([]);
        return;
      }

      const groupIds = memberships.map((m) => m.group_chat_id);

      const { data: chats, error: chatsError } = await supabase
        .from("group_chats")
        .select("id, name, created_at, updated_at")
        .in("id", groupIds)
        .order("updated_at", { ascending: false });

      if (chatsError) {
        console.error("Error fetching group chats:", chatsError);
        setGroups([]);
        return;
      }

      if (!chats?.length) {
        setGroups([]);
        return;
      }

      const lastMessages: Record<string, { content: string; created_at: string }> = {};
      await Promise.all(
        chats.map(async (gc) => {
          const { data: msgs } = await supabase
            .from("group_chat_messages")
            .select("content, created_at")
            .eq("group_chat_id", gc.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (msgs) lastMessages[gc.id] = msgs;
        })
      );

      setGroups(
        chats.map((c) => ({
          id: c.id,
          name: c.name ?? t("groupChat.defaultName"),
          created_at: c.created_at,
          updated_at: c.updated_at,
          last_message: lastMessages[c.id] ?? null,
        }))
      );
    } finally {
      setLoadingGroups(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/phone-auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user, fetchGroups]);

  if (loading || loadingGroups) {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center pb-16">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16">
      <header className="flex items-center justify-between px-3 py-3 safe-area-top bg-background border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg text-foreground absolute left-1/2 -translate-x-1/2">
          {t("groupChat.title")}
        </h1>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <div className="flex-1 overflow-auto p-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" aria-hidden />
            <p className="text-muted-foreground mb-4">{t("groupChat.noGroups")}</p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/group-chat/create">
                <MessageCircle className="w-4 h-4 shrink-0" />
                {t("groupChat.create")}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {groups.map((group) => (
              <li key={group.id}>
                <Card
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/group-chat/${group.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.last_message
                          ? group.last_message.content
                          : t("groupChat.noMessagesYet")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {group.last_message
                        ? format(new Date(group.last_message.created_at), "MMM d", {
                            locale: dateLocale,
                          })
                        : format(new Date(group.updated_at), "MMM d", {
                            locale: dateLocale,
                          })}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {groups.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/group-chat/create">
                <MessageCircle className="w-4 h-4 shrink-0" />
                {t("groupChat.create")}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
