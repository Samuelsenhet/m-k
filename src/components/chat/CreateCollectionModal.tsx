import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getProfilesAuthKey } from "@/lib/profiles";
import { useCollections } from "@/hooks/useCollections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface PotentialMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSuccess?: (collectionId: string) => void;
}

export function CreateCollectionModal({
  open,
  onOpenChange,
  onCreateSuccess,
}: CreateCollectionModalProps) {
  const { user } = useAuth();
  const { create } = useCollections();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [potentialMembers, setPotentialMembers] = useState<PotentialMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMutualMatches = useCallback(async () => {
    if (!user || !open) return;
    setLoadingMembers(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("user_id, matched_user_id")
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual");

      if (matchesError || !matchesData?.length) {
        setPotentialMembers([]);
        setLoadingMembers(false);
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

      const list: PotentialMember[] = (profilesData ?? []).map((p: Record<string, unknown>) => ({
        id: String(p[profileKey] ?? ""),
        displayName: String(p.display_name ?? "Användare"),
        avatarUrl: (p.avatar_url as string | null) ?? null,
      })).filter((m) => m.id);
      setPotentialMembers(list);
    } catch {
      setPotentialMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setName("");
      setSelectedIds(new Set());
      setError(null);
      fetchMutualMatches();
    }
  }, [open, fetchMutualMatches]);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Namn krävs");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await create(trimmed, Array.from(selectedIds));
    setSubmitting(false);
    if (result) {
      onOpenChange(false);
      onCreateSuccess?.(result.id);
    } else {
      setError("Kunde inte skapa samlingen");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ny samling</DialogTitle>
          <DialogDescription>
            Ge samlingen ett namn och välj medlemmar från dina matchningar (valfritt).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Namn</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Kompisgänget"
              maxLength={80}
              autoFocus
            />
          </div>
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label>Lägg till medlemmar</Label>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : potentialMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Du har inga ömsesidiga matchningar att lägga till. Du kan skapa samlingen och lägga till medlemmar senare.
              </p>
            ) : (
              <ul className="border border-border rounded-lg divide-y divide-border overflow-auto max-h-48">
                {potentialMembers.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggleMember(m.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors",
                        selectedIds.has(m.id) && "bg-primary/10"
                      )}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={m.avatarUrl ?? undefined} alt="" />
                        <AvatarFallback className="text-xs">
                          {(m.displayName?.slice(0, 1) ?? "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate flex-1">{m.displayName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {selectedIds.has(m.id) ? "Vald" : "Välj"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Skapar...
                </>
              ) : (
                "Skapa samling"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
