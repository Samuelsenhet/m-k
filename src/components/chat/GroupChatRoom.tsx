import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, MoreHorizontal, LogOut } from "lucide-react";
import { GroupAvatar } from "./GroupAvatar";
import type { SamlingGroup } from "@/hooks/useGroups";
import { cn } from "@/lib/utils";
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

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

interface GroupChatRoomProps {
  group: SamlingGroup;
  currentUserId: string;
  onBack: () => void;
  leaveGroup: (groupId: string) => Promise<boolean>;
}

export function GroupChatRoom({ group, currentUserId, onBack, leaveGroup }: GroupChatRoomProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [input, setInput] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("id, group_id, sender_id, content, message_type, created_at")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });
      setMessages((data as GroupMessage[]) ?? []);
    };
    load();
  }, [group.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`group:${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${group.id}` },
        (payload) => {
          const row = payload.new as GroupMessage;
          setMessages((prev) => [...prev, { id: row.id, group_id: row.group_id, sender_id: row.sender_id, content: row.content, message_type: row.message_type ?? "text", created_at: row.created_at }]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await supabase.from("group_messages").insert({
      group_id: group.id,
      sender_id: currentUserId,
      content: text,
      message_type: "text",
    });
  };

  const handleLeave = async () => {
    const ok = await leaveGroup(group.id);
    if (ok) onBack();
    setShowLeaveConfirm(false);
  };

  const senderName = (senderId: string) => group.members.find((m) => m.user_id === senderId)?.display_name ?? "Användare";

  return (
    <div className="flex flex-1 flex-col h-full min-h-0 bg-background">
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-primary text-primary-foreground shrink-0">
        <button type="button" onClick={onBack} className="p-1 rounded-full hover:bg-white/10" aria-label="Tillbaka">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <GroupAvatar members={group.members} size={44} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{group.name}</h2>
          <p className="text-xs text-primary-foreground/80">{group.members.length} medlemmar</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="p-2 rounded-full hover:bg-white/10" aria-label="Meny">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setShowLeaveConfirm(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("groupChat.leaveGroup")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                {!isOwn && (
                  <div className="text-xs text-muted-foreground shrink-0 w-16 truncate">{senderName(msg.sender_id)}</div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-2 rounded-2xl",
                    isOwn ? "bg-primary text-primary-foreground rounded-br-md ml-auto" : "bg-muted rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={`Skriv till ${group.name}...`}
          className="rounded-full flex-1"
        />
        <Button size="icon" className="rounded-full shrink-0" onClick={sendMessage} disabled={!input.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </div>
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groupChat.leaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("groupChat.leaveDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("groupChat.stayInSamling")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("groupChat.leaveSamling")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
