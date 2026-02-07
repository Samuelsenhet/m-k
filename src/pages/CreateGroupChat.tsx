import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfilesAuthKey } from "@/lib/profiles";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MatchOption {
  id: string;
  matched_user_id: string;
  display_name: string;
  avatar_url: string | null;
}

export default function CreateGroupChat() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("id, user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual")
        .order("created_at", { ascending: false });

      if (matchesError || !matchesData?.length) {
        setMatches([]);
        return;
      }

      const matchedUserIds = matchesData.map((m) =>
        m.user_id === user.id ? m.matched_user_id : m.user_id
      );
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, matchedUserIds);

      const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      (profilesData ?? []).forEach((p: Record<string, unknown>) => {
        const id = p[profileKey] as string;
        if (id)
          profileMap.set(id, {
            display_name: (p.display_name as string) ?? null,
            avatar_url: (p.avatar_url as string) ?? null,
          });
      });

      setMatches(
        matchedUserIds.map((matched_user_id) => ({
          id: matchesData.find(
            (m) =>
              (m.user_id === user.id && m.matched_user_id === matched_user_id) ||
              (m.matched_user_id === user.id && m.user_id === matched_user_id)
          )!.id,
          matched_user_id,
          display_name: profileMap.get(matched_user_id)?.display_name ?? t("groupChat.unknownUser"),
          avatar_url: profileMap.get(matched_user_id)?.avatar_url ?? null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/phone-auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) fetchMatches();
  }, [user, fetchMatches]);

  const toggle = (matchedUserId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchedUserId)) next.delete(matchedUserId);
      else next.add(matchedUserId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedIds.size < 2) {
      toast.error(t("groupChat.minTwoRequired"));
      return;
    }

    const name = groupName.trim() || t("groupChat.defaultName");
    setSubmitting(true);
    try {
      const { data: group, error: groupError } = await supabase
        .from("group_chats")
        .insert({ name, created_by: user.id })
        .select("id")
        .single();

      if (groupError || !group) {
        console.error(groupError);
        toast.error(t("groupChat.errorCreate"));
        return;
      }

      const memberIds = [user.id, ...selectedIds];
      const { error: membersError } = await supabase.from("group_chat_members").insert(
        memberIds.map((user_id) => ({ group_chat_id: group.id, user_id }))
      );

      if (membersError) {
        console.error(membersError);
        toast.error(t("groupChat.errorCreate"));
        return;
      }

      toast.success(t("groupChat.created"));
      navigate(`/group-chat/${group.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16">
      <header className="flex items-center gap-2 px-3 py-3 safe-area-top bg-background border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => navigate("/group-chat")}
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg text-foreground">{t("groupChat.create")}</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="group-name">{t("groupChat.groupName")}</Label>
          <Input
            id="group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t("groupChat.groupNamePlaceholder")}
            className="max-w-md"
            maxLength={64}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("groupChat.selectMatches")}</Label>
          <p className="text-sm text-muted-foreground">{t("groupChat.selectMatchesHint")}</p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : matches.length < 2 ? (
            <p className="text-sm text-muted-foreground py-4">{t("groupChat.needMoreMatches")}</p>
          ) : (
            <ul className="space-y-2" role="list">
              {matches.map((m) => (
                <li key={m.matched_user_id}>
                  <Card
                    className={cn(
                      "p-3 flex items-center gap-3 cursor-pointer transition-colors",
                      selectedIds.has(m.matched_user_id)
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => toggle(m.matched_user_id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.matched_user_id)}
                      onChange={() => toggle(m.matched_user_id)}
                      className="sr-only"
                      aria-label={m.display_name}
                    />
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(m.display_name || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate flex-1">
                      {m.display_name}
                    </span>
                    {selectedIds.has(m.matched_user_id) && (
                      <span className="text-xs text-primary font-medium shrink-0">
                        {t("common.confirm")}
                      </span>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={
              loading || submitting || selectedIds.size < 2 || (submitting && true)
            }
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
                {t("groupChat.creating")}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 shrink-0" aria-hidden />
                {t("groupChat.create")}
              </>
            )}
          </Button>
          {selectedIds.size > 0 && selectedIds.size < 2 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {t("groupChat.minTwoRequired")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
