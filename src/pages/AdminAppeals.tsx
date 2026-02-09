import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProfileData } from "@/hooks/useProfileData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, FileQuestion, Loader2 } from "lucide-react";
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
  const { t, i18n } = useTranslation();
  const { isModerator } = useProfileData(user?.id);
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
        setAppeals((data as AppealRow[]) ?? []);
      }
      setLoading(false);
    };

    fetchAppeals();
  }, [user, isModerator]);

  const handleStatusChange = async (appealId: string, status: AppealStatus) => {
    setUpdatingId(appealId);
    const { error } = await supabase
      .from("appeals")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appealId);
    if (error) {
      console.error("Error updating appeal:", error);
      setUpdatingId(null);
      return;
    }
    setAppeals((prev) =>
      prev.map((a) => (a.id === appealId ? { ...a, status, updated_at: new Date().toISOString() } : a))
    );
    if (status === "approved" || status === "rejected") {
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            template: "appeal_decision",
            data: { appeal_id: appealId, status },
            language: i18n.language?.startsWith("en") ? "en" : "sv",
          },
        });
      } catch (e) {
        console.warn("Appeal decision email failed:", e);
      }
    }
    setUpdatingId(null);
  };

  if (!user) return null;
  if (!isModerator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Du har inte behörighet att visa denna sida.</p>
        <Button asChild variant="outline">
          <Link to="/profile">Tillbaka till profil</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16">
      <header className="flex items-center gap-2 px-3 py-3 safe-area-top bg-background border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile" aria-label={t("common.back")}>
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <CardHeader className="flex-1 p-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            Överklaganden
          </CardTitle>
        </CardHeader>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : appeals.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Inga överklaganden.</p>
        ) : (
          <div className="space-y-4">
            {appeals.map((appeal) => (
              <Card key={appeal.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appeal.created_at), "d MMM yyyy, HH:mm", { locale: sv })}
                    </p>
                    <Select
                      value={appeal.status}
                      onValueChange={(value) => handleStatusChange(appeal.id, value as AppealStatus)}
                      disabled={updatingId === appeal.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Väntar</SelectItem>
                        <SelectItem value="reviewing">Granskas</SelectItem>
                        <SelectItem value="approved">Godkänd</SelectItem>
                        <SelectItem value="rejected">Avslagen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{appeal.reason}</p>
                  {appeal.report_id && (
                    <p className="text-xs text-muted-foreground">Rapport: {appeal.report_id}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
