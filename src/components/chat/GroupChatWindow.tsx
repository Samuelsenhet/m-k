import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { ArrowLeft, Send, Loader2, Users, MoreVertical, LogOut, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCollectionMessages, type CollectionMessage } from "@/hooks/useCollectionMessages";
import { useCollectionMembers, type CollectionMemberWithProfile } from "@/hooks/useCollectionMembers";
import { useCollections, type CollectionWithMeta } from "@/hooks/useCollections";

interface GroupChatWindowProps {
  collection: CollectionWithMeta;
  onBack: () => void;
  onLeave: () => void;
}

function getSenderName(
  message: CollectionMessage,
  members: CollectionMemberWithProfile[],
  currentUserId: string | undefined
): string {
  if (message.type !== "text" || !message.sender_id) {
    return message.type === "system" ? "System" : message.type === "ai" ? "AI" : "?";
  }
  if (message.sender_id === currentUserId) return "Du";
  const m = members.find((x) => x.user_id === message.sender_id);
  return m?.display_name ?? "Användare";
}

export function GroupChatWindow({ collection, onBack, onLeave }: GroupChatWindowProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [newMessage, setNewMessage] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sending, error, sendMessage } = useCollectionMessages(collection.id);
  const { members, loading: membersLoading, refetch: refetchMembers } = useCollectionMembers(collection.id);
  const { leave, addMember } = useCollections();

  const isOwner = members.some((m) => m.user_id === user?.id && m.role === "owner");
  const [potentialMembers, setPotentialMembers] = useState<{ id: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [loadingPotential, setLoadingPotential] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const fetchPotentialMembers = useCallback(async () => {
    if (!user || !isOwner) return;
    setLoadingPotential(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual");
      if (matchesError || !matchesData?.length) {
        setPotentialMembers([]);
        setLoadingPotential(false);
        return;
      }
      const matchedUserIds = [...new Set(
        matchesData.map((m) => (m.user_id === user.id ? m.matched_user_id : m.user_id))
      )];
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, matchedUserIds);
      const list = (profilesData ?? []).map((p: Record<string, unknown>) => ({
        id: String(p[profileKey] ?? ""),
        displayName: String(p.display_name ?? "Användare"),
        avatarUrl: (p.avatar_url as string | null) ?? null,
      })).filter((m) => m.id);
      setPotentialMembers(list);
    } catch {
      setPotentialMembers([]);
    } finally {
      setLoadingPotential(false);
    }
  }, [user, isOwner]);

  useEffect(() => {
    if (showMembers && isOwner) fetchPotentialMembers();
  }, [showMembers, isOwner, fetchPotentialMembers]);

  const handleAddMember = async (userId: string, displayName: string) => {
    setAddingUserId(userId);
    const ok = await addMember(collection.id, userId);
    setAddingUserId(null);
    if (ok) {
      await refetchMembers();
      toast.success("Medlem tillagd.");
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          supabase.functions
            .invoke("collection-system-message", {
              body: {
                collection_id: collection.id,
                event: "member_added",
                display_name: displayName,
              },
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            .catch(() => {});
        }
      });
    } else {
      toast.error("Kunde inte lägga till medlem.");
    }
  };

  const memberIds = new Set(members.map((m) => m.user_id));
  const addableMembers = potentialMembers.filter((p) => !memberIds.has(p.id));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending) return;
    sendMessage(content).then((ok) => {
      if (ok) setNewMessage("");
      else toast.error("Kunde inte skicka. Försök igen.");
    });
  };

  const handleLeaveConfirm = async () => {
    const myDisplayName = members.find((m) => m.user_id === user?.id)?.display_name ?? "Användare";
    const ok = await leave(collection.id);
    setShowLeaveConfirm(false);
    if (ok) {
      toast.success("Du har lämnat samlingen.");
      if (isOwner) {
        toast.info("Gruppen har nu ingen ägare. Nya medlemmar kan inte läggas till.");
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          supabase.functions
            .invoke("collection-system-message", {
              body: {
                collection_id: collection.id,
                event: "member_left",
                display_name: myDisplayName,
              },
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            .catch(() => {});
        }
      });
      onLeave();
    } else {
      toast.error("Kunde inte lämna samlingen.");
    }
  };

  const isOwn = (msg: CollectionMessage) => msg.sender_id === user?.id;
  const isSystemOrAi = (msg: CollectionMessage) => msg.type === "system" || msg.type === "ai";

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-3 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-semibold text-lg truncate flex-1 min-w-0">{collection.name}</h2>
        <button
          type="button"
          onClick={() => setShowMembers(true)}
          className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
          aria-label="Medlemmar"
          title="Medlemmar"
        >
          <Users className="w-5 h-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
              aria-label="Fler alternativ"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Lämna samlingen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 pb-4" role="list" aria-label="Meddelanden">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col",
                  isOwn(msg) && "items-end",
                  isSystemOrAi(msg) && "items-center"
                )}
              >
                {!isOwn(msg) && !isSystemOrAi(msg) && (
                  <span className="text-xs text-muted-foreground mb-0.5 px-1">
                    {getSenderName(msg, members, user?.id)}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-3 py-2 text-sm rounded-2xl",
                    isOwn(msg) && "msn-bubble-own",
                    !isOwn(msg) && !isSystemOrAi(msg) && "msn-bubble-them",
                    isSystemOrAi(msg) && "bg-muted/80 text-muted-foreground text-center text-xs"
                  )}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {format(new Date(msg.created_at), "HH:mm", { locale: sv })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border bg-background shrink-0">
        {error && (
          <p className="text-sm text-destructive mb-2" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv ett meddelande..."
            disabled={sending}
            className="flex-1 rounded-2xl"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="rounded-full shrink-0">
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Members sheet */}
      <Sheet open={showMembers} onOpenChange={setShowMembers}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Medlemmar</SheetTitle>
          </SheetHeader>
          {membersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ul className="py-4 space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="text-sm">
                        {(m.display_name?.slice(0, 1) ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate block">{m.display_name}</span>
                      <span className="text-xs text-muted-foreground">{m.role === "owner" ? "Skapare" : "Medlem"}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {isOwner && (
                <div className="border-t border-border pt-4 mt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Lägg till medlem
                  </h3>
                  {loadingPotential ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : addableMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      Inga fler matchningar att lägga till, eller alla är redan medlemmar.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {addableMembers.map((p) => (
                        <li key={p.id} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={p.avatarUrl ?? undefined} alt="" />
                            <AvatarFallback className="text-xs">
                              {(p.displayName?.slice(0, 1) ?? "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate flex-1">{p.displayName}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={addingUserId === p.id}
                            onClick={() => handleAddMember(p.id, p.displayName)}
                          >
                            {addingUserId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Lägg till"
                            )}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Leave confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lämna samlingen?</AlertDialogTitle>
            <AlertDialogDescription>
              Du kommer inte längre att se meddelanden eller kunna skriva i denna samling. Du kan läggas till igen av en medlem.
              {isOwner && " Om du lämnar har gruppen ingen ägare – endast en ägare kan lägga till medlemmar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Lämna
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
