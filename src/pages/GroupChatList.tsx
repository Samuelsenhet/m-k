import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { CardV2, ButtonPrimary, ButtonSecondary, LoadingStateWithMascot, EmptyStateWithMascot } from "@/components/ui-v2";
import { PageHeader } from "@/components/layout";
import { SCREEN_CONTAINER_CLASS } from "@/layout/screenLayout";
import { COLORS } from "@/design/tokens";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
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
        if (import.meta.env.DEV) console.error("Error fetching group memberships:", memError);
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
        if (import.meta.env.DEV) console.error("Error fetching group chats:", chatsError);
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

  const groupEmotionalConfig = { screen: "chat" as const } as const;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-24 safe-area-bottom">
        <LoadingStateWithMascot
          message={t("common.loading")}
          className="flex-1"
          emotionalConfig={groupEmotionalConfig}
        />
      </div>
    );
  }

  if (!user) return null;

  if (loadingGroups) {
    return (
      <div className="min-h-screen flex flex-col bg-background pb-24 safe-area-bottom">
        <div className={SCREEN_CONTAINER_CLASS}>
          <PageHeader title={t("groupChat.title")} />
          <LoadingStateWithMascot message={t("common.loading")} className="min-h-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24 safe-area-bottom" style={{ background: COLORS.neutral.offWhite }}>
      <div className={SCREEN_CONTAINER_CLASS}>
        <div className="space-y-6">
          <PageHeader
            title={t("groupChat.title")}
            actions={
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="p-2 rounded-full transition-opacity hover:opacity-90 shrink-0"
                style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
                aria-label={t("common.back")}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            }
          />

          {groups.length === 0 ? (
            <EmptyStateWithMascot
              screenState={MASCOT_SCREEN_STATES.SAMLINGAR_EMPTY}
              title={t("groupChat.emptyHeading")}
              description={t("groupChat.emptyBody")}
              emotionalConfig={groupEmotionalConfig}
              action={{
                label: t("groupChat.createFirst"),
                onClick: () => navigate("/group-chat/create"),
              }}
            />
          ) : (
            <>
              <ul className="space-y-3" role="list">
                {groups.map((group) => (
                  <li key={group.id}>
                    <CardV2
                      padding="sm"
                      className="cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => navigate(`/group-chat/${group.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: COLORS.primary[100] }}
                        >
                          <Users className="w-5 h-5" style={{ color: COLORS.primary[600] }} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {group.last_message
                              ? t("groupChat.lastShared", { text: group.last_message.content })
                              : t("groupChat.sharedContext")}
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
                    </CardV2>
                  </li>
                ))}
              </ul>
              <div className="flex justify-center">
                <ButtonSecondary asChild className="gap-2">
                  <Link to="/group-chat/create">
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    {t("groupChat.create")}
                  </Link>
                </ButtonSecondary>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
