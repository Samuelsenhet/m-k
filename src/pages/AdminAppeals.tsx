import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FileQuestion, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

type AppealStatus = "pending" | "reviewing" | "approved" | "rejected";

interface AppealRow {
  id: string;
  user_id: string;
  report_id: string | null;
  reason: string;
  status: AppealStatus;
  created_at: string;
  updated_at: string;
}

export default function AdminAppeals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isModerator, setIsModerator] = useState<boolean | null>(null);
  const [appeals, setAppeals] = useState<AppealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/phone-auth");
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const checkModerator = async () => {
      const { data } = await supabase
        .from("moderator_roles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsModerator(!!data);
    };
    checkModerator();
  }, [user]);

  useEffect(() => {
    if (!user || !isModerator) return;

    const fetchAppeals = async () => {
      const { data, error } = await supabase
        .from("appeals")
        .select("id, user_id, report_id, reason, status, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching appeals:", error);
        setAppeals([]);
      } else {
        setAppeals((data ?? []) as AppealRow[]);
      }
      setLoading(false);
    };

    fetchAppeals();
  }, [user, isModerator]);

  const updateStatus = async (appealId: string, status: AppealStatus) => {
    setUpdatingId(appealId);
    const { error } = await supabase
      .from("appeals")
      .update({ status })
      .eq("id", appealId);
    if (error) {
      console.error("Error updating appeal:", error);
    } else {
      setAppeals((prev) =>
        prev.map((a) => (a.id === appealId ? { ...a, status } : a))
      );
    }
    setUpdatingId(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isModerator === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
        <p className="text-muted-foreground text-center mb-4">
          {t("admin.access_denied")}
        </p>
        <Button asChild>
          <Link to="/profile">{t("common.back")}</Link>
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            {t("admin.appeals_title")}
          </h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : appeals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {t("admin.no_appeals")}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {appeals.map((a) => (
              <li key={a.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="font-serif text-sm flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-normal">
                        {format(new Date(a.created_at), "d MMM yyyy HH:mm", {
                          locale: sv,
                        })}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                      {a.reason}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-muted-foreground">
                        {t("admin.status")}:
                      </span>
                      <Select
                        value={a.status}
                        onValueChange={(v) =>
                          updateStatus(a.id, v as AppealStatus)
                        }
                        disabled={updatingId === a.id}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">
                            {t("appeal.status_pending")}
                          </SelectItem>
                          <SelectItem value="reviewing">
                            {t("appeal.status_reviewing")}
                          </SelectItem>
                          <SelectItem value="approved">
                            {t("appeal.status_approved")}
                          </SelectItem>
                          <SelectItem value="rejected">
                            {t("appeal.status_rejected")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingId === a.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
