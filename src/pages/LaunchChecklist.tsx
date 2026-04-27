import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/version";
import { BottomNav } from "@/components/navigation/BottomNav";
import { CardV2, CardV2Content, CardV2Header, CardV2Title } from "@/components/ui-v2";
import { ButtonPrimary } from "@/components/ui-v2";
import { ChevronLeft, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { ButtonIcon } from "@/components/ui-v2";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "maak_launch_checklist";

const GO_NO_GO_ITEMS: { id: string; label: string }[] = [
  { id: "auth", label: "Auth: Registrering och inloggning fungerar. E-post/telefon verifiering fungerar." },
  { id: "matches", label: "Matches: match-daily svarar 200 (eller 202 WAITING). Inga 401. UI visar matchningar, väntfas eller tydligt fel + retry." },
  { id: "chat", label: "Chat: 1:1-chatt fungerar. Inga tysta fel som visas som tomt." },
  { id: "samlingar", label: "Samlingar: Skapa grupp, chatta, lämna, systemmeddelanden. Inga tysta fel." },
  { id: "felhantering", label: "Felhantering: Vid 401/5xx visas tydlig felmeddelande och retry (minst Matches)." },
  { id: "demo", label: "Demo: VITE_ENABLE_DEMO är inte true i produktion. Demo-routes nås inte av vanliga användare." },
  { id: "ci", label: "CI: GitHub Actions Supabase-deploy (project ref + secrets) konfigurerad." },
];

function loadChecklistState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveChecklistState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export default function LaunchChecklist() {
  const { user } = useAuth();
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "ok" | "fail">("idle");
  const [testMessage, setTestMessage] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>(loadChecklistState);
  const [signOffDate, setSignOffDate] = useState("");
  const [signOffName, setSignOffName] = useState("");

  const run401Test = useCallback(async () => {
    if (!user) {
      setTestStatus("fail");
      setTestMessage("Logga in och kör testet igen.");
      return;
    }
    setTestStatus("running");
    setTestMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setTestStatus("fail");
        setTestMessage("Ingen session – logga in och kör testet igen.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("match-status", {
        body: { user_id: user.id },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        const msg = typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Okänt fel";
        const is401 = msg.includes("401") || msg.includes("Unauthorized") || msg.includes("JWT");
        setTestStatus("fail");
        setTestMessage(
          is401
            ? "match-status: 401. Blocker 1 kvar – kontrollera Dashboard (Logs, SUPABASE_URL/ANON_KEY) och env."
            : `match-status: fel – ${msg}`
        );
        return;
      }

      if (data != null) {
        setTestStatus("ok");
        setTestMessage("match-status: 200/202. Blocker 1 OK (i denna session).");
      } else {
        setTestStatus("fail");
        setTestMessage("match-status: inget svar – kontrollera Dashboard och env.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestStatus("fail");
      setTestMessage(`Fel: ${msg}. Vid 401: kontrollera Dashboard (Logs, SUPABASE_URL/ANON_KEY) och env.`);
    }
  }, [user]);

  const toggleCheck = (id: string) => {
    const next = { ...checklist, [id]: !checklist[id] };
    setChecklist(next);
    saveChecklistState(next);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <ButtonIcon asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </ButtonIcon>
          <h1 className="font-serif text-lg font-bold">Release-checklista</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">För releaseansvarig. Version och 401-test i appen; sign-off i docs/LAUNCH_BLOCKERS_AND_GO_NO_GO.md.</p>

        {/* Version och mål */}
        <CardV2>
          <CardV2Header>
            <CardV2Title>Version och mål</CardV2Title>
          </CardV2Header>
          <CardV2Content className="space-y-2">
            <p className="text-sm font-medium">Version: {APP_VERSION}</p>
            <p className="text-sm text-muted-foreground">
              MÄÄK – personlighetsbaserad matchning, dagliga matchningar, AI-isbrytare och Kemi-Check (video).
            </p>
          </CardV2Content>
        </CardV2>

        {/* 401-test */}
        <CardV2>
          <CardV2Header>
            <CardV2Title>401-test</CardV2Title>
          </CardV2Header>
          <CardV2Content className="space-y-3">
            <ButtonPrimary onClick={run401Test} disabled={testStatus === "running"} className="gap-2">
              {testStatus === "running" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kör …
                </>
              ) : (
                "Kör 401-test"
              )}
            </ButtonPrimary>
            {testMessage && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg p-3 text-sm",
                  testStatus === "ok" && "bg-green-500/10 text-green-700 dark:text-green-400",
                  testStatus === "fail" && "bg-destructive/10 text-destructive"
                )}
              >
                {testStatus === "ok" && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                {testStatus === "fail" && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{testMessage}</span>
              </div>
            )}
          </CardV2Content>
        </CardV2>

        {/* Go/No-Go */}
        <CardV2>
          <CardV2Header>
            <CardV2Title>Go / No-Go</CardV2Title>
          </CardV2Header>
          <CardV2Content className="space-y-3">
            {GO_NO_GO_ITEMS.map(({ id, label }) => (
              <label key={id} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checklist[id]}
                  onChange={() => toggleCheck(id)}
                  className="mt-1 rounded border-border"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </CardV2Content>
        </CardV2>

        {/* Sign-off */}
        <CardV2>
          <CardV2Header>
            <CardV2Title>Sign-off</CardV2Title>
          </CardV2Header>
          <CardV2Content className="space-y-3">
            <p className="text-sm text-muted-foreground">
              När alla punkter och 401-test är OK, fyll i sign-off i docs/LAUNCH_BLOCKERS_AND_GO_NO_GO.md.
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Datum
                <input
                  type="text"
                  value={signOffDate}
                  onChange={(e) => setSignOffDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="ml-2 rounded border border-border px-2 py-1 text-sm"
                />
              </label>
              <label className="text-sm font-medium">
                Namn
                <input
                  type="text"
                  value={signOffName}
                  onChange={(e) => setSignOffName(e.target.value)}
                  placeholder="Namn/signatur"
                  className="ml-2 rounded border border-border px-2 py-1 text-sm w-48"
                />
              </label>
            </div>
          </CardV2Content>
        </CardV2>

        {/* Dashboard-länk */}
        <CardV2>
          <CardV2Content className="pt-6">
            <p className="text-sm font-medium mb-2">Vid 401</p>
            <p className="text-sm text-muted-foreground mb-3">
              Supabase Dashboard → Edge Functions → Logs; Project Settings → SUPABASE_URL / SUPABASE_ANON_KEY samma projekt som frontend.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Supabase Dashboard
            </a>
            <p className="text-sm text-muted-foreground mt-3">
              Full checklista: <code className="rounded bg-muted px-1">docs/LAUNCH_BLOCKERS_AND_GO_NO_GO.md</code>
            </p>
          </CardV2Content>
        </CardV2>
      </div>

      <BottomNav />
    </div>
  );
}
