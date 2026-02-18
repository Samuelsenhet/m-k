import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Send, Users, MoreVertical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface GroupMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export default function GroupChatWindow() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState<string>("");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateLocale = i18n.language === "sv" ? sv : enUS;

  const fetchGroupAndMessages = useCallback(async () => {
    if (!user || !groupId) return;

    setLoading(true);
    setForbidden(false);
    try {
      const { data: group, error: groupError } = await supabase
        .from("group_chats")
        .select("id, name")
        .eq("id", groupId)
        .single();

      if (groupError || !group) {
        setForbidden(true);
        setGroupName("");
        setMessages([]);
        return;
      }

      setGroupName(group.name ?? t("groupChat.defaultName"));

      const { data: msgs, error: msgError } = await supabase
        .from("group_chat_messages")
        .select("id, group_chat_id, sender_id, content, created_at")
        .eq("group_chat_id", groupId)
        .order("created_at", { ascending: true });

      if (msgError) {
        setForbidden(true);
        setMessages([]);
        return;
      }

      const senderIds = [...new Set((msgs ?? []).map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", senderIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = p.display_name ?? t("chat.you");
      });

      setMessages(
        (msgs ?? []).map((m) => ({
          ...m,
          sender_name: nameMap[m.sender_id] ?? t("chat.you"),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [user, groupId, t]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/phone-auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchGroupAndMessages();
  }, [fetchGroupAndMessages]);

  useEffect(() => {
    if (!groupId || !user) return;

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_chat_id=eq.${groupId}`,
        },
        async (payload) => {
          const newRow = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newRow.sender_id)
            .single();
          setMessages((prev) => [
            ...prev,
            {
              id: newRow.id,
              group_chat_id: groupId,
              sender_id: newRow.sender_id,
              content: newRow.content,
              created_at: newRow.created_at,
              sender_name: profile?.display_name ?? t("chat.you"),
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, t]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleLeaveGroup = useCallback(async () => {
    if (!user || !groupId) return;
    setLeaving(true);
    try {
      const { error } = await supabase
        .from("group_chat_members")
        .delete()
        .eq("group_chat_id", groupId)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(t("groupChat.leftGroup"));
      setShowLeaveConfirm(false);
      navigate("/group-chat");
    } catch {
      toast.error(t("groupChat.errorLeave"));
    } finally {
      setLeaving(false);
    }
  }, [user, groupId, t, navigate]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !user || !groupId || sending) return;

    setSending(true);
    setInput("");
    const { error } = await supabase.from("group_chat_messages").insert({
      group_chat_id: groupId,
      sender_id: user.id,
      content: text,
    });

    if (error) {
      toast.error(t("chat.send_failed"));
      setInput(text);
    }
    setSending(false);
  }, [input, user, groupId, sending, t]);

  if (authLoading || !user) return null;

  if (!groupId) {
    navigate("/group-chat");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center pb-16">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-background items-center justify-center p-4 pb-16">
        <p className="text-muted-foreground text-center mb-4">
          {t("groupChat.notFoundOrNoAccess")}
        </p>
        <Button variant="outline" onClick={() => navigate("/group-chat")}>
          {t("groupChat.backToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16">
      <header className="flex items-center gap-2 px-3 py-3 safe-area-top bg-background border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => navigate("/group-chat")}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Users className="w-5 h-5 text-primary shrink-0" aria-hidden />
          <h1 className="font-semibold text-lg text-foreground truncate">{groupName}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-full text-foreground hover:bg-muted transition-colors shrink-0"
              aria-label={t("groupChat.moreOptions")}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2 shrink-0" aria-hidden />
              {t("groupChat.leaveGroup")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[340px] gap-4 p-6" aria-describedby={undefined}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              {t("groupChat.leaveTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/90">
              {t("groupChat.leaveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel disabled={leaving}>{t("groupChat.stayInSamling")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeaveGroup();
              }}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaving ? t("groupChat.leaving") : t("groupChat.leaveSamling")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2 pb-4" role="list" aria-label={t("chat.messages")}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{t("groupChat.emptyRoomLine1")}</p>
              <p className="text-sm text-muted-foreground mb-4">{t("groupChat.emptyRoomLine2")}</p>
              <p className="text-xs text-muted-foreground italic">{t("groupChat.firstSystemMessage")}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}
                  role="listitem"
                >
                  {!isOwn && (
                    <span className="text-xs font-medium text-muted-foreground mb-0.5">
                      {msg.sender_name}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 text-sm rounded-2xl",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <span
                      className={cn(
                        "text-xs mt-1 block",
                        isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(msg.created_at), "HH:mm", { locale: dateLocale })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border bg-background shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={messages.length === 0 ? t("groupChat.emptyRoomCta") : t("chat.typeMessage")}
            className="flex-1"
            aria-label={t("chat.typeMessage")}
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label={t("chat.send")}>
            <Send className="w-4 h-4 shrink-0" />
          </Button>
        </form>
      </div>
    </div>
  );
}
