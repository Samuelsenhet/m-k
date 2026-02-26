import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL_EXPORT } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

/**
 * Temporary DEV-only diagnostics: session status, project URL, current user id.
 * Renders only when import.meta.env.DEV is true.
 * Hidden by default; set VITE_SHOW_DEV_DIAGNOSTICS=true to show in dev.
 */
export function DevDiagnosticsPanel() {
  const { user } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<"checking" | "yes" | "no">("checking");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setSessionStatus(session?.access_token ? "yes" : "no");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Hidden unless explicitly enabled via env (keeps component in tree for easy re-enable)
  const showDiagnostics =
    import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_DIAGNOSTICS === "true";
  if (!showDiagnostics) return null;

  const projectUrl =
    typeof SUPABASE_URL_EXPORT === "string" && SUPABASE_URL_EXPORT
      ? SUPABASE_URL_EXPORT
      : import.meta.env.VITE_SUPABASE_URL ?? "(not set)";

  return (
    <div
      className="fixed bottom-2 right-2 z-[9999] max-w-[280px] rounded border border-amber-500/60 bg-amber-950/95 px-2 py-1.5 font-mono text-xs text-amber-100 shadow"
      aria-label="DEV diagnostics"
    >
      <div className="font-semibold text-amber-300">DEV</div>
      <div>session: {sessionStatus}</div>
      <div className="truncate" title={projectUrl}>
        url: {projectUrl || "(empty)"}
      </div>
      <div className="truncate" title={user?.id ?? ""}>
        user: {user?.id ?? "(none)"}
      </div>
    </div>
  );
}
