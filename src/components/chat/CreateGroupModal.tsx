import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonPrimary, InputV2, AvatarV2, AvatarV2Image, AvatarV2Fallback } from "@/components/ui-v2";
import { Users, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MutualMatchOption {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
  createGroup: (name: string, memberUserIds: string[]) => Promise<string | null>;
}

function getPhotoUrl(storagePath: string | null) {
  if (!storagePath) return undefined;
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(storagePath);
  return data?.publicUrl;
}

export function CreateGroupModal({
  open,
  onClose,
  onCreated,
  createGroup,
}: CreateGroupModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<MutualMatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchMutualMatches = useCallback(async () => {
    if (!user || !open) return;
    setLoading(true);
    try {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual");
      if (!matchesData?.length) {
        setOptions([]);
        return;
      }
      const userIds = matchesData.map((m) =>
        m.user_id === user.id ? m.matched_user_id : m.user_id
      );
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select(`${profileKey}, display_name, avatar_url`)
        .in(profileKey, userIds);
      const list: MutualMatchOption[] = (profilesData ?? []).map((p: Record<string, unknown>) => ({
        user_id: (p[profileKey] ?? p.id ?? p.user_id) as string,
        display_name: (p.display_name as string) ?? "Användare",
        avatar_url: (p.avatar_url as string | null) ?? null,
      }));
      setOptions(list);
    } finally {
      setLoading(false);
    }
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setName("");
      setSelectedIds(new Set());
      fetchMutualMatches();
    }
  }, [open, fetchMutualMatches]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedIds.size < 2 || !name.trim()) return;
    setCreating(true);
    try {
      const id = await createGroup(name.trim(), Array.from(selectedIds));
      if (id) {
        onCreated(id);
        onClose();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groupChat.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("groupChat.groupName")}</label>
            <InputV2
              placeholder={t("groupChat.groupNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1.5">{t("groupChat.groupNamePreview")}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("groupChat.selectMatches")}
            </label>
            <p className="text-xs text-muted-foreground mb-2">{t("groupChat.selectMatchesHint")}</p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : options.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {t("groupChat.needMoreMatches")}
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-auto">
                {options.map((opt) => {
                  const selected = selectedIds.has(opt.user_id);
                  return (
                    <button
                      key={opt.user_id}
                      type="button"
                      onClick={() => toggle(opt.user_id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-colors text-left",
                        selected ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <AvatarV2 className="h-10 w-10 rounded-full">
                        <AvatarV2Image src={getPhotoUrl(opt.avatar_url) ?? undefined} />
                        <AvatarV2Fallback className="bg-primary/20 text-primary font-semibold">
                          {opt.display_name.charAt(0).toUpperCase()}
                        </AvatarV2Fallback>
                      </AvatarV2>
                      <span className="flex-1 font-medium">{opt.display_name}</span>
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}
                      >
                        {selected && <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <ButtonPrimary
            className="w-full"
            size="lg"
            disabled={selectedIds.size < 2 || !name.trim() || creating}
            onClick={handleCreate}
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
            {t("groupChat.create")}
          </ButtonPrimary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
